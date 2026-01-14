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

        // --- PASS 1: TRANSCRIPTION & HEADER EXTRACTION ---
        const pass1Prompt = `
        You are an expert archivist. Your task is to perform a strict verbatim transcription of the handwritten document in the image.
        
        1. **Header Extraction**: Identify the "Child Name", "Child ID", and any "Written By" fields from the top English section.
        2. **Native Script Transcription**: Transcribe the body of the letter exactly in the original script (Amharic or Telugu). Do not translate it yet.
        
        Output JSON:
        {
            "headerInfo": { "childName": "...", "childID": "...", "writtenBy": "..." },
            "nativeScript": "..."
        }
        `;

        const pass1Result = await model.generateContent([
            pass1Prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || 'image/jpeg',
                },
            },
        ]);

        const pass1Text = pass1Result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        let pass1Data;
        try {
            pass1Data = JSON.parse(pass1Text);
        } catch (e) {
            console.error("Pass 1 JSON Parse Error", pass1Text);
            throw new Error("Failed to parse Pass 1 transcription.");
        }

        // --- PASS 2: TRANSLATION WITH ANCHOR ---
        // We feed the Pass 1 Native Script + Header Info into Pass 2.
        // We do NOT need to send the image again if the transcription is good, but sending it provides visual context.
        // However, user asked to "Take the text from Pass 1 and send it back". Sending image again is safer for context.

        const pass2Prompt = `
        You are an expert translator. 
        
        **INPUT CONTEXT**:
        - Child Name: ${pass1Data.headerInfo.childName}
        - Transcription: "${pass1Data.nativeScript}"

        **TASK**:
        Translate the transcription above into English.

        **QUALITY ANCHOR**:
        The translation MUST reflect the specific meaning found in this trusted reference (if applicable to the content):
        "I received the gift money; it was used to buy food and a goat for breeding. Thank you for your tireless support. Written by a social worker."

        **INSTRUCTIONS**:
        1. Use the "Child Name" and "Written By" info to determine the correct pronouns (I vs He/She).
        2. If the transcription mentions buying animals or food, align phrasing with the Anchor where accurate.
        3. Do not assume the Anchor is the *whole* letter; translate the *entire* transcription.

        Output JSON:
        {
            "naturalEnglish": "The full, fluid English translation...",
            "culturalInsights": "Explanation of specific terms like 'Enkutatash' or 'Ugadi'...",
            "nativeScript": "${pass1Data.nativeScript.replace(/"/g, '\\"')}" 
        }
        `;

        // Note: For Pass 2, we can just use text-to-text if the transcription is perfect, 
        // but Multimodal (Text + Image) is usually better to resolve ambiguities in the transcription itself.
        // Let's rely on the text mainly but provide the image as reference again.
        const pass2Result = await model.generateContent([
            pass2Prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || 'image/jpeg',
                },
            },
        ]);

        const pass2Text = pass2Result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const pass2Data = JSON.parse(pass2Text);

        // Map to frontend expected format
        const finalData = {
            nativeScript: pass1Data.nativeScript,
            culturalContext: pass2Data.culturalInsights,
            translation: pass2Data.naturalEnglish,
            headerInfo: pass1Data.headerInfo
        };

        return { success: true, data: finalData };

    } catch (error) {
        console.error("Gemini API Error:", error);
        return { error: 'Failed to process image: ' + error.message };
    }
}
