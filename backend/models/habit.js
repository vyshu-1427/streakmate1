import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  icon: {
    type: String,
    default: "🎯",
  },
  emoji: {
    type: String,
    required: true,
    default: "🎯"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily',
  },
  target: {
    type: Number,
    default: 1,
  },
  time: {
    type: String,
    default: '',
  },
  timeFrom: {
    type: String,
    default: '',
  },
  timeTo: {
    type: String,
    default: '',
  },
  completedDates: [{
    type: String, // Format: YYYY-MM-DD
  }],
  streak: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Habit", habitSchema);
