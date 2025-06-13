import express from "express";
import {
  applyToJob,
  withdrawApplication,
  getJobApplications,
  updateApplicationStatus,
  getUserAppliedJobs
} from "../controllers/applicationController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from '../middleware/uploadMiddleware.js';

export const checkApplicantRole = (req, res, next) => {
  if (req.user.role !== 'Applicant') {
    return res.status(403).json({ message: 'Only applicants can perform this action' });
  }
  next();
};

export const checkEmployerRole = (req, res, next) => {
  if (req.user.role !== 'Employer') {
    return res.status(403).json({ message: 'Only employers can perform this action' });
  }
  next();
};

const router = express.Router();

router.post( "/jobs/:jobId/apply", protect, checkApplicantRole,
  upload.fields([
    { name: 'resume', maxCount: 1 },
  ]),
  applyToJob
);

router.delete("/jobs/:jobId/apply", protect, checkApplicantRole, withdrawApplication);

router.get("/jobs/:jobId/applications", protect, checkEmployerRole, getJobApplications);

router.patch("/applications/:applicationId/status", protect, checkEmployerRole, updateApplicationStatus);

router.get("/user/applied", protect, checkApplicantRole, getUserAppliedJobs);

export default router;
