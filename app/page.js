'use client';

import { useState } from 'react';
import { translateImage } from './actions';
import UploadView from './components/UploadView';
import TranslationView from './components/TranslationView';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // 1. Basic adjustments
        // No filters applied. Sending raw image to model.
        // 1. Basic adjustments
        // No filters applied. Sending raw image to model.
        ctx.drawImage(img, 0, 0);

        // Custom sharpening removed to preserve natural ink pressure artifacts.

        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, { type: file.type });
            resolve(processedFile);
          } else {
            reject(new Error('Image processing failed'));
          }
        }, file.type);
      };
      img.onerror = (e) => reject(e);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (selectedFile) => {
    // Show original immediately for speed, or wait? 
    // Let's show original first then update if needed, but since we want to send processed...
    // Actually, let's process first. It's fast.

    try {
      setLoading(true);
      setResult(null);
      setError(null);

      // Pre-process image to enhance handwriting
      const processedFile = await processImage(selectedFile);

      setFile(processedFile); // Use processed file for state
      setPreviewUrl(URL.createObjectURL(processedFile)); // Show processed image to user so they see what AI sees

      const formData = new FormData();
      formData.append('image', processedFile);

      const response = await translateImage(formData);

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setResult(response.data);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during processing.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-transparent p-4 flex flex-col">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-center"
          >
            <UploadView onFileSelect={handleFileSelect} />
          </motion.div>
        ) : (
          <motion.div
            key="translation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1"
          >
            <TranslationView
              file={file}
              previewUrl={previewUrl}
              initialResult={result}
              onReset={handleReset}
              isProcessing={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="font-bold mb-1">Error</div>
          <div>{error}</div>
          <button onClick={() => setError(null)} className="absolute top-2 right-2 text-white/50 hover:text-white">✕</button>
        </div>
      )}
    </main>
  );
}
