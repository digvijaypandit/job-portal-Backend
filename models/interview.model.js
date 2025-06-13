import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: { type: String, required: true },
  userAnswer: { type: String, required: true },
  score: { type: Number, min: 0, max: 10 },
  suggestion: { type: String }
});

const interviewSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  interviewType: { type: String, enum: ['Technical', 'HR', 'Coding'], required: true },
  level: { type: String, enum: ['Basic', 'Medium', 'Advanced'], required: true },
  language: { type: String },
  field: { type: String },
  answers: [answerSchema],  
  averageScore: { type: Number, min: 0, max: 10 },
  isFinished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

export default InterviewSession;
