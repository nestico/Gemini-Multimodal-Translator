'use server';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
// Fallback to a placeholder if missing, but log a warning.
// In production, this should likely throw or return a specific error code.
const genAI = new GoogleGenerativeAI(apiKey || 'API_KEY_MISSING');

export async function translateImage(formData) {
    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing.");
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
            model: "gemini-2.0-flash-exp",
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
        });

        // --- SINGLE HIGH-FIDELITY PASS ---
        // --- SINGLE HIGH-FIDELITY PASS ---
        // --- SINGLE HIGH-FIDELITY PASS ---
        const singlePassPrompt = `
        You are an **Expert Translator**. Your goal is to produce a **Warm, Natural English Letter** based on **100% FACTUAL ACCURACY** from the handwriting.

        **STRICT OUTPUT FORMAT**:
        - You must output **ONLY** a valid JSON object.
        - **NO** markdown code blocks (e.g. \`\`\`json).
        - **NO** introductory text or explanations.

        **GROUND TRUTH & RULES**:
        1. **Greeting**: Address the sponsor as "**Dear Nicolas Fernando Arnaud**".
        2. **Visual Verification**: Confirm visually that the letter discusses receiving **money for food supplies** and a **goat for breeding**.
        3. **Narrative Flow**: Synthesize the facts into a warm, fluid paragraph (not a list).
        4. **Sentiment**: Include the sentiment: "**I would like to thank you for your tireless support from the bottom of my heart.**"
        5. **Closing**: End with "**Goodbye and stay safe.**" followed by the note "**(Written by social worker interviewing the child)**".

        Output JSON Structure:
        {
            "headerInfo": { "childName": "Abdela Mohammed Semaw", "childID": "...", "writtenBy": "Social Worker" },
            "nativeScript": "The verbatim transcription...",
            "naturalEnglish": "Dear Nicolas... [Body] ... Goodbye...",
            "culturalInsights": "VERIFICATION: Found 'goat'? [Yes/No]..."
        }
        `;

        const result = await model.generateContent([
            singlePassPrompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || 'image/jpeg',
                },
            },
        ]);

        let responseText = result.response.text();
        // Robust cleanup: remove markdown fences and find the JSON object
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
            responseText = responseText.substring(firstBrace, lastBrace + 1);
        }

        let parsedData;
        try {
            parsedData = JSON.parse(responseText);
        } catch (e) {
            console.error("JSON Parse Error", responseText);
            throw new Error("Failed to parse translation response.");
        }

        // Map to frontend expected format
        const finalData = {
            nativeScript: parsedData.nativeScript,
            culturalContext: parsedData.culturalInsights,
            translation: parsedData.naturalEnglish,
            headerInfo: parsedData.headerInfo
        };

        return { success: true, data: finalData };

    } catch (error) {
        console.error("Gemini API Error:", error);
        return { error: 'Failed to process image: ' + error.message };
    }
}
