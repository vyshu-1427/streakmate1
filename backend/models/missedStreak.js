import mongoose from 'mongoose';

const MissedStreakSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  habitName: { type: String, required: true },
  date: { type: Date, default: Date.now },
  userExplanation: { type: String, required: true },
  // aiReply is no longer persisted to history by default. Keep optional for backward compatibility.
  aiReply: { type: String },
});

export default mongoose.model('MissedStreak', MissedStreakSchema);
