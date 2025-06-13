import express from "express";
import {
  startInterview,
  getNextQuestion,
  submitAnswer,
  finishInterview,
  getInterviewList,
  getInterviewDetails,
} from "../controllers/interviews.controller.js";

const router = express.Router();

router.post("/start", startInterview);
router.get("/question/:sessionId", getNextQuestion);
router.post("/answer", submitAnswer);
router.post("/finish", finishInterview);
router.get("/user/:userId", getInterviewList);
router.get("/:interviewId", getInterviewDetails);
export default router;
