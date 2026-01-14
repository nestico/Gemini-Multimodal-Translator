# Gemini Multimodal Translator

A Next.js application that leverages Google's Gemini Multimodal capabilities to translate handwritten letters and scripts (specifically Amharic & Telugu) into English, while providing deep cultural context.

## Features

- **"Literal Scribe" Engine**: Specialized single-pass analysis for high-fidelity handwriting transcription.
- **Fact Verification**: Automatically cross-references handwritten content with expected context (e.g., verifying specific Amharic terms).
- **Narrative Synthesis**: Converts verified facts into warm, natural English letters.
- **Multimodal Analysis**: Upload raw images for direct processing by Gemini 2.0 Flash.

## Getting Started

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Environment Variables**:
    Create a `.env.local` file in the root directory:
    ```env
    GEMINI_API_KEY=your_google_api_key
    ```
4.  **Run the development server**:
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **AI Model**: Google Gemini (via `@google/generative-ai` SDK)
- **Styling**: CSS Modules / Global CSS

## Deployment

See [DEPLOYMENT-PLAN.md](./DEPLOYMENT-PLAN.md) for detailed deployment instructions.

## Session History

See [SESSION-NOTES.md](./SESSION-NOTES.md) for tracking recent changes and plans.
