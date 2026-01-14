'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'API_KEY_MISSING');

export async function translateImage(formData) {
    if (!apiKey) {
        return { error: 'Gemini API Key is missing in environment variables.' };
    }

    const file = formData.get('image');
    if (!file) {
        return { error: 'No file uploaded.' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `
    You are an expert linguist and translator specializing in Amharic and Telugu.
    Your task is to transcribe the handwritten letter in the image exactly in its native script, explain any cultural context or idioms, and provide an accurate English translation.

    Follow this Chain-of-Thought process:
    1. **Transcription**: Transcribe the text verbatim in the original script (Amharic or Telugu).
    2. **Cultural Analysis**: Identify and explain any idioms, specific cultural references, or nuances.
    3. **Translation**: Provide a fluent and accurate English translation.

    Return the result as a valid JSON object with the following structure:
    {
      "nativeScript": "The exact transcription in the native script",
      "culturalContext": "Explanation of cultural nuances...",
      "translation": "The English translation"
    }
    IMPORTANT: Return ONLY the JSON object. Do not wrap it in markdown code blocks.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || 'image/jpeg',
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();

        console.log("Gemini Raw Response:", text);

        // Sanitize and parse
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(cleanText);
            return { success: true, data };
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError, text);
            return { error: 'Failed to parse Gemini response.', raw: text };
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        return { error: 'Failed to process image: ' + error.message };
    }
}
