const express = require("express");
const app = express();
const PORT = 3000;
const cors = require("cors");
const { OpenAIApi } = require("openai");
const Configuration = require("./Configuration");
const axios = require("axios");
//require("dotenv").config(); // Remove this line

app.use(cors());
app.use(express.json());

// Initialize OpenAI configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// System prompt for AI responses
const SYSTEM_PROMPT = `You are a customer service representative named Santosh from Amazone. Instructions:
1. Be polite and professional
2. First acknowledge the customer's concern
3. Provide helpful solutions
4. be short and precise"`;
// TTS function using OpenAI
async function synthesizeSpeech(text) {
    try {
        console.log("Generating speech for:", text);
        const response = await axios({
            method: "post",
            url: "https://api.openai.com/v1/audio/speech",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            data: {
                model: "tts-1",
                input: text,
                voice: "echo",
                response_format: "mp3",
            },
            responseType: "arraybuffer",
        });

        console.log("Speech generated successfully");
        const audioBase64 = Buffer.from(response.data).toString("base64");
        return audioBase64;
    } catch (error) {
        console.error("TTS Error:", error.message);
        throw error;
    }
}

// Main endpoint for text processing
app.post("/send-text", async (req, res) => {
    const { text } = req.body;
    console.log("\n--------------------");
    console.log("Received text:", text);

    if (!text) {
        console.log("No text provided");
        return res.status(400).json({ error: "No text provided" });
    }

    try {
        // Calculate appropriate max_tokens based on input length
        const inputLength = text.length;
        const maxTokens = Math.min(Math.max(inputLength * 2, 100), 500);
        // Short questions get shorter responses, long questions get longer responses
        // Minimum 100 tokens, maximum 500 tokens

        console.log("Getting AI response...");
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: text },
            ],
            temperature: 0.7,
            max_tokens: maxTokens, // Dynamic token limit
            presence_penalty: 0.6, // Encourages varied responses
            frequency_penalty: 0.5, // Reduces repetition
        });

        const aiResponse = response.data.choices[0].message.content;
        console.log("AI Response:", aiResponse);

        // Generate speech
        console.log("Converting to speech...");
        const audioBase64 = await synthesizeSpeech(aiResponse);

        // Send response
        console.log("Sending response to frontend");
        res.json({
            aiResponse: aiResponse,
            audio: audioBase64,
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({
            error: "Error processing request",
            details: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("Ready to process requests");
});