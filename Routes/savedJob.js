import express from 'express';
import { saveJob, removeSavedJob, getSavedJobs } from '../controllers/SavedJobController.js'
import { protect } from "../middleware/authMiddleware.js";

export const checkApplicantRole = (req, res, next) => {
    if (req.user.role !== 'Applicant') {
      return res.status(403).json({ message: 'Only applicants can perform this action' });
    }
    next();
  };
  
const router = express.Router();

// Save a job
router.post('/save', protect, checkApplicantRole, saveJob);

// Remove a saved job
router.post('/remove', protect, checkApplicantRole, removeSavedJob);

// Get all saved jobs for a user
router.get('/', protect, checkApplicantRole, getSavedJobs);

export default router;
