import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import MissedStreak from '../models/missedStreak.js';
import Habit from '../models/habit.js';
import genAI from '../services/aiClients.js';
import { getEmotionType, generateEmotionalPrompt } from '../services/emotionalEngine.js';

// Generate a contextual AI reply using Gemini AI based on user's explanation
async function generateMotivation(reason, habit, user = {}) {
  const cleaned = (reason || '').trim();
  // If no reason is provided, we cannot generate a message.
  if (!cleaned) {
    return "A reason is required to generate a motivational message.";
  }

  // --- Use Google Gemini API ---
  try {
    if (!genAI) {
      throw new Error("Gemini AI client is not initialized due to a missing API key.");
    }

    console.log("Attempting to generate motivation with Gemini...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const streak = habit && habit.streak ? habit.streak : 0;
    const longestStreak = habit && habit.longestStreak ? habit.longestStreak : 0;

    // Determine emotion type
    const emotionType = getEmotionType(streak, true);

    // Generate system prompt
    const systemPrompt = generateEmotionalPrompt(
      habit ? habit.name : '',
      streak,
      longestStreak,
      reason,
      emotionType
    );

    const userPrompt = `I missed my streak because: '${reason}'. Please help me!`;

    const result = await model.generateContent([systemPrompt, userPrompt]);
    const geminiReply = result.response.text().trim();

    if (geminiReply) {
      console.log("Successfully generated motivation with Gemini.");
      return geminiReply;
    }

    throw new Error("Gemini returned an empty response.");
  } catch (aiError) {
    console.error(`AI Error: Gemini failed. ${aiError.message}`);

    if (aiError.message && aiError.message.includes("API key not valid")) {
      return "AI Error: The Gemini API key is invalid or missing. Please check the server configuration.";
    }

    return "I'm having a little trouble thinking of the right words. Just remember that every day is a new opportunity to succeed!";
  }
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
      const freshReply = await generateMotivation(userExplanation, habit, req.user || {});
      return res.json({ success: true, entry: existing, aiReply: freshReply });
    }

    // generate an AI reply (may call OpenAI or fallback templates)
    const aiReply = await generateMotivation(userExplanation, habit, req.user || {});

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
