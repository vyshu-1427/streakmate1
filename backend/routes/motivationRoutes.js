import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import MissedStreak from '../models/missedStreak.js';
import Habit from '../models/habit.js';

// Generate a contextual AI reply using template-based fallback to avoid repetitive replies.
async function generateMotivation(reason, habitName = '', user = {}) {
  const cleaned = (reason || '').trim();
  // Use template-based fallback for motivation

  // Template fallback with small randomization to avoid identical replies
  const templates = {
    sick: [
      "Take the time you need — your health matters. When you feel ready, come back to ${habit} one small step at a time.",
      "Rest up and be kind to yourself. A short recovery will help you return stronger to ${habit}.",
      "Your wellbeing comes first. Focus on recovering and later ease back into ${habit} with a tiny goal."
    ],
    study: [
      "Good on you for prioritizing study — the habit will be here when you're ready. Try a 5-minute version of ${habit} after your revision.",
      "Balancing study and habits is tough. Small wins count — do one short routine for ${habit} when you can.",
      "Keep going with your studies; when time frees up, ease back into ${habit} with a tiny attainable task."
    ],
    busy: [
      "Life gets busy — that’s normal. Even 3-5 minutes for ${habit} keeps momentum and reduces friction.",
      "Busy days happen. Try a micro-version of ${habit} today to stay connected to the routine.",
      "Consistency beats perfection. A small action towards ${habit} today is better than nothing."
    ],
    work: [
      "Work can pile up — try scheduling a short break to do a quick ${habit} step and your energy will thank you.",
      "It’s okay to let things slide during intense work. When possible, carve a tiny pocket for ${habit} to rebuild momentum.",
      "Honor your work responsibilities; then reward yourself with a brief ${habit} action to keep the streak alive."
    ],
    default: [
      "Everyone faces setbacks. Don't be harsh on yourself — take one small step for ${habit} tomorrow.",
      "Setbacks are temporary. Keep the lesson, then try a tiny, easy step for ${habit} to get back on track.",
      "This happens to everyone. Focus on your next small action for ${habit} and celebrate that return."
    ]
  };

  const low = cleaned.toLowerCase();
  let bucket = 'default';
  if (low.includes('sick') || low.includes('ill') || low.includes('fever')) bucket = 'sick';
  else if (low.includes('exam') || low.includes('study') || low.includes('revision')) bucket = 'study';
  else if (low.includes('busy') || low.includes('overtime') || low.includes('packed')) bucket = 'busy';
  else if (low.includes('work') || low.includes('job') || low.includes('shift')) bucket = 'work';

  const choices = templates[bucket] || templates.default;
  const pick = choices[Math.floor(Math.random() * choices.length)];
  // replace placeholder and ensure short length
  return pick.replace(/\$\{habit\}/g, habitName || 'this habit');
}

// Save missed streak with AI reply
const saveMotivation = async (req, res) => {
  try {
    const { habitId, userExplanation } = req.body;
    if (!habitId || !userExplanation) return res.status(400).json({ success: false, message: 'Habit and reason required.' });
    const habit = await Habit.findById(habitId);
    if (!habit) return res.status(404).json({ success: false, message: 'Habit not found' });
    // prevent duplicate submission for same habit within 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await MissedStreak.findOne({
      user: req.user.id,
      habitId,
      date: { $gte: since }
    });
    if (existing) {
      // generate a fresh ai reply but do not save it
      const freshReply = await generateMotivation(userExplanation, habit.name, req.user || {});
      return res.json({ success: true, entry: existing, aiReply: freshReply });
    }

    // generate an AI reply (may call OpenAI or fallback templates)
    const aiReply = await generateMotivation(userExplanation, habit.name, req.user || {});

    // Save only the user's reason to history
    const entry = new MissedStreak({
      user: req.user.id,
      habitId,
      habitName: habit.name,
      userExplanation,
    });
    await entry.save();
    res.json({ success: true, entry, aiReply });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get motivation history for user
const getMotivationHistory = async (req, res) => {
  try {
    const history = await MissedStreak.find({ user: req.user.id }).sort({ date: -1 });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const router = express.Router();
router.post('/missed', authMiddleware, saveMotivation);
router.get('/history', authMiddleware, getMotivationHistory);

export default router;
