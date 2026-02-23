import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function test() {
    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            console.log("No API KEY!");
            return;
        }
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const res = await model.generateContent(["Test system prompt", "Test user message"]);
        console.log("SUCCESS:");
        console.log(res.response.text());
    } catch (err) {
        console.error("FAILED:");
        console.error(err);
    }
}

test();
