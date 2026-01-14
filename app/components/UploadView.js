'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function UploadView({ onFileSelect }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processAndCrop = (file) => {
        // Bypass cropping to allow full context (headers + handwriting)
        return Promise.resolve(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const croppedFile = await processAndCrop(e.dataTransfer.files[0]);
            onFileSelect(croppedFile);
        }
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const croppedFile = await processAndCrop(e.target.files[0]);
            onFileSelect(croppedFile);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <div className="text-center mb-10 space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">Upload & Pre-process</h2>
                <p className="text-slate-400">Crop, rotate, and enhance your image before translation.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Left: Instructions/Input Source */}
                <div className="md:col-span-4 flex flex-col gap-6 order-2 md:order-1">
                    <div className="bg-surface/50 border border-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-2">Input Source</h3>
                        <p className="text-slate-400 text-sm mb-6">Select a file or take a new photo.</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleClick}
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white font-medium group"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">📸</span>
                                <span>Select from Gallery</span>
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="bg-background-dark/50 border border-white/5 p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Tips for best results:</h3>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-0.5">💡</span>
                                Ensure handwriting is legible and clear.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-0.5">✂️</span>
                                Crop out background noise.
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-0.5">🔄</span>
                                Rotate image to be vertical.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right: Upload Zone */}
                <div className="md:col-span-8 order-1 md:order-2">
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
              relative cursor-pointer group
              flex flex-col items-center justify-center
              h-[400px] w-full rounded-2xl border-2 border-dashed
              transition-all duration-300
              ${isDragging
                                ? 'border-primary bg-primary/10 scale-[1.02]'
                                : 'border-white/20 bg-surface/30 hover:border-white/40 hover:bg-surface/50'
                            }
            `}
                    >
                        <div className="flex flex-col items-center p-6 text-center">
                            <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-primary/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                <span className="text-4xl text-white/80">☁️</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Click or drag file here</h3>
                            <p className="text-slate-400 max-w-xs">Supports JPG, PNG, WebP up to 10MB</p>
                        </div>

                        {/* Decorative background glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-blue-500/5 rounded-2xl pointer-events-none" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
