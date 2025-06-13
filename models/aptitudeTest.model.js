import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  question: String,
  userAnswer: String,
  correctAnswer: String,
  explanation: String,
});

const aptitudeTestSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    category: { type: String, default: "Logical Reasoning" },
    level: { type: String, default: "medium" },
    answers: [answerSchema],
    isFinished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AptitudeTestSession = mongoose.model(
  "AptitudeTestSession",
  aptitudeTestSessionSchema
);
export default AptitudeTestSession;
