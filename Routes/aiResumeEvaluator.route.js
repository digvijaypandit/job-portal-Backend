import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { evaluateResume } from '../controllers/aiResumeEvaluator.controller.js';

const router = express.Router();

// `resume` is the field name used in <input type="file" name="resume">
router.post(
  '/ai/evaluate-resume',
  upload.single('resume'),
  evaluateResume
);

export default router;
