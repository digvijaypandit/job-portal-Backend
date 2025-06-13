import mongoose from 'mongoose';

const MentorshipSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(), // For grouping sessions into chats
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Enable virtual population of the profile
MentorshipSessionSchema.virtual('profile', {
  ref: 'Profile',
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});

// Ensure virtuals are included when converting to JSON or Object
MentorshipSessionSchema.set('toObject', { virtuals: true });
MentorshipSessionSchema.set('toJSON', { virtuals: true });

export default mongoose.model('MentorshipSession', MentorshipSessionSchema);
