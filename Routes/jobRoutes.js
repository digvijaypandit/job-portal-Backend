import express from 'express';
import { createJob, deleteJob, updateJob, getJobsByEmployerId, findJobs, getJobById, findJobsByApplicantProfile } from '../controllers/jobController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const checkEmployerRole = (req, res, next) => {
  if (req.user.role !== 'Employer') {
    return res.status(403).json({ message: 'Only employers can perform this action' });
  }
  next();
};

const checkApplicantRole = (req, res, next) => {
  if (req.user.role !== 'Applicant') {
    return res.status(403).json({ message: 'Only employers can perform this action' });
  }
  next();
};

const router = express.Router();

router.post('/create', protect, checkEmployerRole, upload.single('companyLogo'), createJob);

router.patch('/:jobId', protect, checkEmployerRole, updateJob);

router.delete('/:jobId', protect, checkEmployerRole, deleteJob);

router.get('/', findJobs);

router.get('/jobs/:id', protect, getJobById);

router.get('/jobs/employer/:employerId', protect, getJobsByEmployerId);

router.get('/recommendations', protect, checkApplicantRole, findJobsByApplicantProfile);

export default router;
