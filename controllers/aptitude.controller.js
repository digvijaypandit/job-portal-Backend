import model from "../config/gemini.js";
import AptitudeTestSession from "../models/aptitudeTest.model.js";

const generateAptitudePrompt = (
  category = "Logical Reasoning",
  level = "medium"
) => {
  return `Generate a ${level}-level aptitude test question in the category of ${category}. Provide four answer options labeled A, B, C, and D at the end of the question. Do not include the correct answer or explanation.`;
};

const evaluateAptitudePrompt = (question) => {
  return `Given the following aptitude question, identify the correct answer (A, B, C, or D) and provide a clear, concise explanation of why it is correct.

Question: "${question}"

Respond in this format:
Correct Answer: <A/B/C/D>
Explanation: <explanation>`;
};

// Start aptitude test
export const startAptitudeTest = async (req, res) => {
  try {
    const { userId, category, level } = req.body;

    const chat = model.startChat();
    const prompt = generateAptitudePrompt(category, level);
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const question = response.text().trim();

    const newSession = new AptitudeTestSession({
      userId,
      category,
      level,
      answers: [],
    });

    await newSession.save();

    res.status(200).json({
      sessionId: newSession._id,
      question,
    });
  } catch (error) {
    console.error("Error starting aptitude test:", error.message);
    res.status(500).json({ error: "Failed to start aptitude test" });
  }
};

// Submit an answer
export const submitAptitudeAnswer = async (req, res) => {
  try {
    const { sessionId, question, userAnswer } = req.body;

    const chat = model.startChat();
    const prompt = evaluateAptitudePrompt(question);
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    const correctAnswerMatch = text.match(/Correct Answer:\s*([ABCD])/i);
    const explanationMatch = text.match(/Explanation:\s*(.+)/i);

    const correctAnswer = correctAnswerMatch
      ? correctAnswerMatch[1].toUpperCase()
      : null;
    const explanation = explanationMatch ? explanationMatch[1].trim() : "";

    if (!correctAnswer) {
      return res
        .status(400)
        .json({ error: "Failed to determine correct answer." });
    }

    const session = await AptitudeTestSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.isFinished) {
      return res
        .status(403)
        .json({ error: "This session is already finished." });
    }

    session.answers.push({
      question,
      userAnswer,
      correctAnswer,
      explanation,
    });

    await session.save();

    res.status(200).json({ correctAnswer, explanation });
  } catch (error) {
    console.error("Error submitting aptitude answer:", error.message);
    res.status(500).json({ error: "Failed to evaluate answer" });
  }
};

// Get next question
export const getNextAptitudeQuestion = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await AptitudeTestSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.isFinished) {
      return res
        .status(403)
        .json({ error: "This session is already finished." });
    }

    const prompt = generateAptitudePrompt(session.category, session.level);
    const chat = model.startChat();
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const question = response.text().trim();

    res.status(200).json({ question });
  } catch (error) {
    console.error("Error getting next aptitude question:", error.message);
    res.status(500).json({ error: "Failed to get next question" });
  }
};

// Finish the test
export const finishAptitudeTest = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await AptitudeTestSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (session.isFinished) {
      return res.status(403).json({ error: "This session is already finished." });
    }

    session.isFinished = true;
    await session.save();

    res.status(200).json({
      message: "Aptitude test finished",
      totalQuestions: session.answers.length,
    });
  } catch (error) {
    console.error("Error finishing aptitude test:", error.message);
    res.status(500).json({ error: "Failed to finish aptitude test" });
  }
};

// List aptitude tests for a user
export const getAptitudeTestList = async (req, res) => {
  const { userId } = req.params;
  try {
    const tests = await AptitudeTestSession.find({ userId })
      .sort({ createdAt: -1 })
      .select("_id category level averageScore createdAt");

    res.status(200).json(tests);
  } catch (error) {
    console.error("Error fetching aptitude test list:", error.message);
    res.status(500).json({ error: "Failed to fetch aptitude tests" });
  }
};

// Get test details by ID
export const getAptitudeTestDetails = async (req, res) => {
  const { testId } = req.params;
  try {
    const test = await AptitudeTestSession.findById(testId);
    if (!test)
      return res.status(404).json({ error: "Aptitude test not found" });

    res.status(200).json(test);
  } catch (error) {
    console.error("Error fetching aptitude test details:", error.message);
    res.status(500).json({ error: "Failed to fetch test details" });
  }
};
