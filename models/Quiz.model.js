import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: {
    type: [String],
    validate: [(val) => val.length === 4, "Each question must have exactly 4 options"],
  },
  answer: { type: String, required: true },
  explanation: { type: String },
  difficulty: {
    type: String,
    enum: ["EASY", "MEDIUM", "HARD"],
    default: "MEDIUM",
  },
});

const leaderboardSchema = new mongoose.Schema({
  week: { type: String, required: true }, // e.g., "2025-W23"
  type: {
    type: String,
    enum: ["BACKGROUND", "GLOBAL"],
    required: true,
  },
  entries: [
    {
      profileId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
      score: { type: Number, required: true },
      timeTaken: { type: Number, required: true }, // seconds
      submittedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

leaderboardSchema.index({ week: 1, type: 1 }, { unique: true });

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

const quizSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    category: {
      type: String,
      enum: ["TECHNICAL", "SOFT_SKILL", "INDUSTRY_KNOWLEDGE"],
      required: true,
    },
    userSegment: { type: String, required: true }, // e.g., "Frontend Dev"

    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: function () {
        return this.type === "BACKGROUND";
      },
    },

    type: {
      type: String,
      enum: ["BACKGROUND", "GLOBAL"],
      default: "BACKGROUND",
    },

    questions: { type: [questionSchema], required: true },
    score: { type: Number, default: 0 },
    variant: { type: Number, default: 1 },
    badgesAwarded: { type: [String], default: [] },
    streak: { type: Number, default: 0 },

    scheduledForWeek: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,
    timeTaken: Number,
  },
  { timestamps: true }
);

quizSchema.index({ scheduledForWeek: 1, type: 1, isCompleted: 1 });
quizSchema.index({ score: -1, timeTaken: 1 }); 

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
export { Leaderboard };