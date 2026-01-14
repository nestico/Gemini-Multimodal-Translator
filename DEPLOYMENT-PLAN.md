# Deployment Plan: Gemini Multimodal Translator

## Overview
This application is built with Next.js and uses Google's Gemini API for multimodal capabilities. The recommended deployment target is **Vercel**, which offers seamless integration with Next.js.

## Prerequisites
1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **GitHub Repository**: Push this code to a GitHub repository.
3.  **Gemini API Key**: Obtain a valid API key from [Google AI Studio](https://aistudio.google.com/).

## Deployment Steps (Vercel)

### 1. Import Project
- Go to your Vercel Dashboard.
- Click **"Add New..."** -> **"Project"**.
- Import the `gemini-multimodal-translato` repository from your GitHub.

### 2. Configure Project
- **Framework Preset**: Next.js (should be auto-detected).
- **Root Directory**: `./` (default).

### 3. Environment Variables
You MUST set the following environment variable for the application to work:

| Name | Value | Description |
|------|-------|-------------|
| `GEMINI_API_KEY` | `your_actual_api_key_here` | The key used to authenticate with Google Generative AI. |

### 4. Deploy
- Click **"Deploy"**.
- Wait for the build to complete.
- Vercel will provide a live URL (e.g., `https://gemini-multimodal-translato.vercel.app`).

## Post-Deployment Verification
- Access the live URL.
- Upload a test image (e.g., a handwritten letter).
- Verify that the translation and cultural context appear correctly.
- Check Vercel **Logs** if any "Internal Server Error" occurs (often due to missing API keys or quota limits).

## Troubleshooting
- **500 Error**: Check if `GEMINI_API_KEY` is set in Vercel Project Settings.
- **Model Not Found**: If the code uses a preview model (like `gemini-3-pro-preview`), ensure your API key has access to it, or switch to a stable model like `gemini-1.5-pro`.
