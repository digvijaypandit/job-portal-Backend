import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers like token  
}));
app.use(express.json()); // To accept JSON data

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
import authRoutes from './Routes/authRoutes.js';
import profileRoutes from './Routes/profileRoutes.js';
import jobRoutes from './Routes/jobRoutes.js'
import applicationRoutes from './Routes/applicationRoutes.js'
import SavedJob from './Routes/savedJob.js';
import interviews from './Routes/interviews.route.js';
import aptitude from './Routes/aptitude.route.js';
import quiz from './Routes/quiz.route.js';
// import resume from './Routes/aiResumeEvaluator.route.js'
import roadmap from './Routes/roadmap.routes.js';
import Mentorship from './Routes/mentorship.routes.js';
// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/application', applicationRoutes);
app.use('/api/savedJob', SavedJob)
app.use('/api/interviews', interviews)
app.use('/api/aptitude', aptitude);
app.use('/api/quiz', quiz);
app.use('/api/roadmap', roadmap);
app.use('/api/mentorship', Mentorship)
// app.use('/api/resume', resume);

// 404 Handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app;
