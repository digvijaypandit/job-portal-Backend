import express from "express";
import {
  getOrGenerateWeeklyQuizByUserId,
  submitQuizAnswers,
  getLeaderboard,
  getGlobalQuiz,
  submitGlobalQuizAnswers,
  getQuizQuestions
} from "../controllers/Quiz.controller.js";

const router = express.Router();

// Weekly personalized quiz
router.get("/home/user/:userId", getOrGenerateWeeklyQuizByUserId);

// Get specific question
router.get("/:quizId/question", getQuizQuestions);

// Submit quiz answers
router.post("/:quizId/submit", submitQuizAnswers);

// Leaderboard
router.get("/leaderboard", getLeaderboard);

// GLOBAL QUIZ (no user needed)
router.get("/global", getGlobalQuiz);

// GLOBAL quiz submit answers
router.post("/global/:quizId/submit", submitGlobalQuizAnswers); 

export default router;
