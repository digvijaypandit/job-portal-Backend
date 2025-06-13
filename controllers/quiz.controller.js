import mongoose from "mongoose";
import Quiz, { Leaderboard } from "../models/Quiz.model.js";
import Profile from "../models/Profile.js";
import {
  generateQuizMetaFromProfile,
  generateQuestionForTopic,
  generateTopicFromGeneric
} from "../utils/quizGenerator.js";

// Utility: get current week string (e.g., "2025-W23")
const getCurrentWeek = () => {
  const now = new Date();
  const year = now.getFullYear();
  const week = Math.ceil(
    ((now - new Date(year, 0, 1)) / 86400000 +
      new Date(year, 0, 1).getDay() +
      1) /
      7
  );
  return `${year}-W${week}`;
};

// user based quiz
export const getOrGenerateWeeklyQuizByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const scheduledForWeek = getCurrentWeek();
    
    // 1. Find profile by userId
    const profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // 2. Check for existing quiz
    let quiz = await Quiz.findOne({ profileId: profile._id, scheduledForWeek });

    if (!quiz) {
      // 3. Generate quiz metadata from profile
      const meta = await generateQuizMetaFromProfile({
        about: profile.about,
        skills: profile.skills || [],
        education: profile.education || [],
      });

      // 4. Generate AI-based questions
      const questions = [];
      for (let i = 0; i < 5; i++) {
        const q = await generateQuestionForTopic(meta.topic);
        questions.push(q);
      }

      // 5. Save quiz to DB
      quiz = new Quiz({
        topic: meta.topic,
        category: meta.category,
        userSegment: meta.userSegment,
        questions,
        profileId: profile._id,
        scheduledForWeek,
      });

      await quiz.save();
    }

    // 6. Only return quiz summary (not the full question/answer set)
    res.status(200).json({
      quizId: quiz._id,
      topic: quiz.topic,
      category: quiz.category,
      userSegment: quiz.userSegment,
      totalQuestions: quiz.questions.length,
      created: !quiz.isNew, // true if this was newly created
    });
  } catch (err) {
    console.error("Quiz home error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getQuizQuestions = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Return all questions at once
    const questions = quiz.questions.map((q, idx) => ({
      index: idx,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
    }));

    res.status(200).json({
      totalQuestions: questions.length,
      questions,
    });
  } catch (err) {
    console.error("Get all questions error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const submitQuizAnswers = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, startedAt } = req.body;

    const quiz = await Quiz.findById(quizId).populate("profileId");
    if (!quiz) {
      console.error("Quiz not found with id:", quizId);
      return res.status(404).json({ error: "Quiz not found" });
    }

    if (quiz.isCompleted) {
      return res.status(400).json({ error: "Quiz already submitted." });
    }

    if (!quiz.profileId) {
      console.error("quiz.profileId not populated or missing:", quiz.profileId);
      return res.status(400).json({ error: "Quiz profileId missing or not populated." });
    }

    if (!mongoose.Types.ObjectId.isValid(quiz.profileId._id)) {
      console.error("Invalid profileId:", quiz.profileId._id);
      return res.status(400).json({ error: "Invalid profileId" });
    }

    let score = 0;
    const detailedAnswers = [];

    quiz.questions.forEach((q, i) => {
      const userAnswer = answers[i];
      const isCorrect =
        userAnswer?.trim().toLowerCase() === q.answer.trim().toLowerCase();

      if (isCorrect) score += 1;

      detailedAnswers.push({
        question: q.question,
        userAnswer,
        correctAnswer: q.answer,
        explanation: q.explanation || "",
        isCorrect,
      });
    });

    const submittedAt = new Date();
    const timeTaken = startedAt
      ? Math.floor((submittedAt - new Date(startedAt)) / 1000)
      : Math.floor((submittedAt - quiz.createdAt) / 1000);

    quiz.score = score;
    quiz.timeTaken = timeTaken;
    quiz.isCompleted = true;
    quiz.completedAt = submittedAt;
    quiz.answers = detailedAnswers;

    await quiz.save();

    if (quiz.type === "BACKGROUND") {
      const castedProfileId = new mongoose.Types.ObjectId(quiz.profileId._id);
      const week = quiz.scheduledForWeek;

      const updateResult = await Leaderboard.findOneAndUpdate(
        { week, type: "BACKGROUND" },
        {
          $push: {
            entries: {
              profileId: castedProfileId,
              score,
              timeTaken,
              submittedAt,
            },
          },
        },
        { upsert: true, new: true }
      );

      if (!updateResult) {
        console.error("Leaderboard update failed or no document found/created.");
        return res.status(500).json({ error: "Failed to update leaderboard." });
      }
    }

    res.status(200).json({
      message: "Quiz submitted successfully",
      score,
      timeTaken,
      totalQuestions: quiz.questions.length,
    });
  } catch (err) {
    console.error("Quiz submit error:", err);
    res.status(500).json({ error: "Failed to submit quiz" });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { type, week, page = 1, limit = 20 } = req.query;

    if (!type || !week) {
      return res.status(400).json({ error: "type and week are required" });
    }

    const skip = (page - 1) * limit;

    // Nested populate: profileId -> userId
    const leaderboardEntry = await Leaderboard.findOne({ type, week })
      .populate({
        path: "entries.profileId",
        select: "userId photo",
        populate: {
          path: "userId",
          select: "firstName lastName",
        },
      });

    if (!leaderboardEntry) {
      return res.status(200).json({ leaderboard: [], total: 0, totalPages: 0, currentPage: Number(page) });
    }

    // Sort entries manually
    const sortedEntries = leaderboardEntry.entries.sort(
      (a, b) => b.score - a.score || a.timeTaken - b.timeTaken
    );

    const total = sortedEntries.length;
    const paginated = sortedEntries.slice(skip, skip + Number(limit));

    // Build leaderboard response
    const leaderboard = paginated.map((entry, index) => ({
      rank: skip + index + 1,
      score: entry.score,
      timeTaken: entry.timeTaken,
      profileId: entry.profileId?._id,
      userId: entry.profileId?.userId?._id,
      firstName: entry.profileId?.userId?.firstName,
      lastName: entry.profileId?.userId?.lastName,
      photo: entry.profileId?.photo,
    }));

    res.status(200).json({
      leaderboard,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error.message);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

// global quiz
export const getGlobalQuiz = async (req, res) => {
  try {
    const currentWeek = getCurrentWeek();

    // 1. Check if a global quiz already exists
    let quiz = await Quiz.findOne({
      type: "GLOBAL",
      scheduledForWeek: currentWeek,
    });

    if (!quiz) {
      // 2. Generate generic topic
      const topic = await generateTopicFromGeneric();

      // 3. Generate 5 questions for the topic
      const questions = [];
      for (let i = 0; i < 5; i++) {
        const q = await generateQuestionForTopic(topic, "MEDIUM");
        questions.push(q);
      }

      // 4. Create new global quiz
      quiz = await Quiz.create({
        type: "GLOBAL",
        topic,
        category: "SOFT_SKILL", // Or "INDUSTRY_KNOWLEDGE"
        userSegment: "ALL",
        questions,
        scheduledForWeek: currentWeek,
      });
    }

    // 5. Return quiz without answers
    const safeQuestions = quiz.questions.map(
      ({ question, options, difficulty }) => ({
        question,
        options,
        difficulty,
      })
    );

    res.status(200).json({
      quizId: quiz._id,
      topic: quiz.topic,
      category: quiz.category,
      questions: safeQuestions,
      scheduledForWeek: quiz.scheduledForWeek,
    });
  } catch (error) {
    console.error("Error fetching global quiz:", error);
    res.status(500).json({ error: "Failed to fetch global quiz" });
  }
};

export const submitGlobalQuizAnswers = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, userId, startedAt } = req.body;

    const profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const profileId = profile._id;

    if(!profileId){
      return res.status(400).json({ error: "Invalid profileId" });
    }

    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({ error: "Invalid profileId format" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    if (quiz.type !== "GLOBAL") {
      return res.status(400).json({ error: "This quiz is not a global quiz" });
    }

    if (quiz.isCompleted) {
      return res.status(400).json({ error: "Quiz already submitted" });
    }

    // Score calculation
    let score = 0;
    const correctAnswers = [];
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach((q, idx) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer?.trim().toLowerCase() === q.answer.trim().toLowerCase();
      if (isCorrect) score += 1;

      correctAnswers.push({
        question: q.question,
        correctAnswer: q.answer,
        userAnswer,
        explanation: q.explanation || "",
        isCorrect,
      });
    });

    const submittedAt = new Date();
    const timeTaken = startedAt
      ? Math.floor((submittedAt - new Date(startedAt)) / 1000)
      : null;

    // Save score and metadata to quiz
    quiz.score = score;
    quiz.isCompleted = true;
    quiz.completedAt = submittedAt;
    quiz.timeTaken = timeTaken;
    quiz.answers = correctAnswers;
    await quiz.save();

    // Save to leaderboard
    const castedProfileId = new mongoose.Types.ObjectId(profileId);
    const week = quiz.scheduledForWeek;

    await Leaderboard.findOneAndUpdate(
      { week, type: "GLOBAL" },
      {
        $push: {
          entries: {
            profileId: castedProfileId,
            score,
            timeTaken,
            submittedAt,
          },
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Global quiz submitted successfully",
      score,
      totalQuestions,
      timeTaken,
    });
  } catch (err) {
    console.error("Submit global quiz error:", err.message);
    res.status(500).json({ error: "Failed to submit global quiz" });
  }
};
