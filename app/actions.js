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

    const files = formData.getAll('image');
    const selectedLanguage = formData.get('language') || 'Auto-Detect';
    console.log(`Processing translation request. Language: ${selectedLanguage}. Files: ${files.length}`);

    if (!files || files.length === 0) {
        return { error: 'No files uploaded.' };
    }

    try {
        const imageParts = await Promise.all(files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            return {
                inlineData: {
                    data: Buffer.from(arrayBuffer).toString('base64'),
                    mimeType: file.type || 'image/jpeg',
                }
            };
        }));

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
        });

        // --- SINGLE HIGH-FIDELITY PASS ---
        // --- SINGLE HIGH-FIDELITY PASS ---
        // --- SINGLE HIGH-FIDELITY PASS ---
        // --- LANGUAGE SPECIFIC RULES ---
        const LANGUAGE_SPECIFIC_RULES = {
            'Telugu': `
            - **Specifics**: Hunt for "**cousin sister/brother**", "**Sankranti holidays**" (3-day festival), and **verbatim gift lists**.`,

            'Amharic': `
            - **Specifics**: Hunt for "**goat for breeding**" and "**food supplies**".`,

            'Tamil': `
            - **Specifics**: Hunt for **formal relationships**, specific school "**Standards**", and **itemized educational gifts**.`,

            'Afan Oromo': `
            - **Specifics**: Maintain **Latin script (Qubee) fidelity**; hunt for **regional agricultural terms** and **specific family blessings**.`,

            'Spanish': `
            - **Specifics**: Hunt for **specific familial relationships** (Padrino/Madrina) and **agricultural updates** like crop names or livestock.`,

            'French': `
            - **Specifics**: Capture **formal levels of gratitude** and **specific educational milestones** (exams, grade levels).`
        };

        const specificRules = LANGUAGE_SPECIFIC_RULES[selectedLanguage] || '';

        // --- SINGLE HIGH-FIDELITY PASS ---
        // --- SINGLE HIGH-FIDELITY PASS ---
        // --- SINGLE HIGH-FIDELITY PASS ---
        const singlePassPrompt = `
        You are an **Expert Translator**${selectedLanguage !== 'Auto-Detect' ? ` specializing in **${selectedLanguage}**` : ''}. Your goal is to produce a **Warm, Natural English Letter** based on the visual content.
        You have received **${files.length} pages** of a single letter.

        **STRICT OUTPUT FORMAT**:
        - You must output **ONLY** a valid JSON object.
        - **NO** markdown code blocks.
        - **NO** introductory text.

        **INSTRUCTIONS**:
        1. **Scope**: **CRITICAL**: You MUST extract and translate text from **ALL ${files.length} images**. Do not stop after the first page.
           - The signature is likely on the last page (Page ${files.length}). Ensure you reach the end.
        2. **Language**: ${selectedLanguage !== 'Auto-Detect' ? `Treat the document as **${selectedLanguage}**.` : 'Identify the language of the handwriting (e.g., Telugu, Amharic).'}
        ${specificRules ? `3. **Language Specific Rules**:${specificRules}` : ''}
        ${specificRules ? '4' : '3'}. **Transcription**: Transcribe the handwritten body **verbatim** into its native script.
        ${specificRules ? '5' : '4'}. **Translation**: Translate the body into **warm, natural English**.
           - Capture the tone and emotion of the writer.
           - Ensure factual accuracy (names, places, items mentioned).
           - **Multi-Page Handling**: Synthesize the text from all ${files.length} images into a single, continuous English translation.
           - **Split Sentences**: If a sentence or thought is split across two images, merge them into a complete, natural sentence in the final output.
        ${specificRules ? '6' : '5'}. **Header Info**: Extract available metadata (Child Name, ID, Project) if present in the header.

        Output JSON Structure:
        {
            "headerInfo": { "childName": "Detected Name", "childID": "Detected ID", "writtenBy": "..." },
            "nativeScript": "Verbatim transcription in native script (for all pages)...",
            "naturalEnglish": "Dear Sponsor... [Full continuous letter from start to finish] ... Sincerely...",
            "culturalInsights": "Language: ${selectedLanguage !== 'Auto-Detect' ? selectedLanguage : '[Detected Language]'}. Notes: [Any cultural nuances or specific terms observed]..."
        }
        `;

        const result = await model.generateContent([
            singlePassPrompt,
            ...imageParts
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
