import express from "express";
import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();
const router = express.Router();

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log("apikey",process.env.GEMINI_API_KEY)
// Hugging Face model endpoint (emotion detection)
const HF_API_URL = "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base";

async function detectEmotion(text) {
  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    const result = await response.json();
    if (Array.isArray(result) && result[0]) {
      return result[0].label; // highest scoring emotion
    }
    return "neutral";
  } catch (err) {
    console.error("Emotion API error:", err);
    return "neutral";
  }
}

// Chatbot route
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    // Step 1: detect emotion
    const emotion = await detectEmotion(message);

    // Step 2: system prompt
    const systemPrompt = `
You are StreakBuddy 🤖, a fun, witty, and supportive AI friend inside StreakMates.
The user is currently feeling: ${emotion}.

- Reply short and casual, like a real friend.
- Use emojis naturally, but not too much.
- If they are sad/angry, be more empathetic.
- If they are happy/excited, be more playful and encouraging.
- Always keep tone human and friendly.
`;

    // Step 3: get reply from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent([systemPrompt, message]);

    res.json({
      success: true,
      emotion,
      reply: response.response.text(),
    });
  } catch (err) {
    console.error("Chatbot Error:", err);
    res.status(500).json({ success: false, error: "Something went wrong with chatbot" });
  }
});

export default router;
