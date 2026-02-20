import express from "express";
import genAI from '../services/aiClients.js';
import { getEmotionType, generateEmotionalPrompt } from '../services/emotionalEngine.js';
import EmotionLog from '../models/EmotionLog.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { message, habitName, currentStreak, longestStreak, missedReason, habitId } = req.body;

    // We can accept either a standard chat message OR a missed streak reason event
    if (!message && !missedReason) {
      return res.status(400).json({ success: false, error: "Message or missedReason is required" });
    }

    const streak = currentStreak || 0;
    const isMissTrigger = !!missedReason;

    // 1. Determine the Emotion Type
    const emotionType = getEmotionType(streak, isMissTrigger);

    // 2. Generate the dynamic System Prompt
    const systemPrompt = generateEmotionalPrompt(
      habitName,
      streak,
      longestStreak,
      missedReason,
      emotionType
    );

    let reply = "";

    // 3. Call Gemini API
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const userPrompt = missedReason ? `I missed my streak because: ${missedReason}` : message;

        const response = await model.generateContent([systemPrompt, userPrompt]);
        reply = response.response.text().trim();
      } catch (aiError) {
        console.error("Gemini AI error:", aiError.message);
        reply = "I'm having trouble thinking right now, but just know I'm always rooting for you! ❤️";
      }
    } else {
      reply = "StreakBuddy is offline right now, but you're doing great. Keep going! 💪";
    }

    // 4. Save to EmotionLog if related to a habit event
    if (habitId || missedReason) {
      try {
        await EmotionLog.create({
          userId: req.user.id,
          habitId: habitId || null,
          currentStreak: streak,
          missedReason: missedReason || "",
          emotionType,
          aiResponse: reply
        });
      } catch (logErr) {
        console.error("Error saving EmotionLog:", logErr.message);
      }
    }

    res.json({
      success: true,
      emotionType,
      reply
    });
  } catch (err) {
    console.error("Chatbot Error:", err);
    res.status(500).json({
      success: false,
      error: "Chatbot temporarily unavailable",
      fallbackReply: "Hey! Something went wrong, but I'm still here for you! 🌟"
    });
  }
});

export default router;
