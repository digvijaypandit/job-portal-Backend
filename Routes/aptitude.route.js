import express from "express";
import {
  startAptitudeTest,
  getNextAptitudeQuestion,
  submitAptitudeAnswer,
  finishAptitudeTest,
  getAptitudeTestList,
  getAptitudeTestDetails,
} from "../controllers/aptitude.controller.js";

const router = express.Router();

router.post("/start", startAptitudeTest); // Start new aptitude test
router.get("/question/:sessionId", getNextAptitudeQuestion); // Get next question
router.post("/answer", submitAptitudeAnswer); // Submit an answer
router.post("/finish", finishAptitudeTest); // Finish the test
router.get("/user/:userId", getAptitudeTestList); // List of all tests for a user
router.get("/:testId", getAptitudeTestDetails); // Get full details of a test

export default router;
