'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TranslationView({ file, previewUrl, initialResult, onReset, isProcessing }) {
    const [activeTab, setActiveTab] = useState('translation');
    const [isZoomed, setIsZoomed] = useState(false);

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 h-[calc(100vh-80px)] min-h-[600px] flex flex-col gap-6">

            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-white">Workspace</h1>
                    <p className="text-slate-400">Deciphering your document.</p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-white/10 hover:bg-white/5 text-white transition-colors"
                >
                    <span>🔄</span> Change Image
                </button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">

                {/* Left Column: Image Preview */}
                <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl overflow-hidden relative group">
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <img
                            src={previewUrl}
                            alt="Original Letter"
                            className={`max-w-full max-h-full object-contain transition-transform duration-500 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                            onClick={() => setIsZoomed(!isZoomed)}
                        />
                    </div>

                    {/* Overlay Controls */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                        <button onClick={() => setIsZoomed(false)} className="text-white hover:text-primary"><span className="text-xl">−</span></button>
                        <span className="text-white/50 text-sm py-1">Zoom</span>
                        <button onClick={() => setIsZoomed(true)} className="text-white hover:text-primary"><span className="text-xl">+</span></button>
                    </div>
                </div>

                {/* Right Column: Results */}
                <div className="flex-1 flex flex-col bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

                    {/* Tabs */}
                    <div className="flex border-b border-white/10 bg-black/20">
                        <button
                            onClick={() => setActiveTab('translation')}
                            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'translation' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                        >
                            English Translation
                        </button>
                        <button
                            onClick={() => setActiveTab('transcription')}
                            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'transcription' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                        >
                            Original Transcription
                        </button>
                        <button
                            onClick={() => setActiveTab('context')}
                            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'context' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-white'}`}
                        >
                            Cultural Context
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">

                        {isProcessing ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface z-10">
                                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                                <h3 className="text-xl font-bold text-white mb-2">Deciphering...</h3>
                                <p className="text-slate-400 text-center max-w-xs">AI is analyzing handwritingstrokes and translating nuances.</p>
                            </div>
                        ) : initialResult ? (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="prose prose-invert max-w-none"
                                >
                                    {activeTab === 'translation' && (
                                        <div className="space-y-4">
                                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                                                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                                                    <span>✨</span> AI Translated
                                                </div>
                                                <p className="text-lg leading-relaxed text-white font-serif whitespace-pre-wrap">
                                                    {initialResult.translation}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'transcription' && (
                                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-6">
                                            <p className="text-lg leading-relaxed text-yellow-100/90 font-serif italic whitespace-pre-wrap">
                                                {initialResult.nativeScript}
                                            </p>
                                        </div>
                                    )}

                                    {activeTab === 'context' && (
                                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-6">
                                            <h4 className="text-blue-200 font-bold mb-2">Notes & Nuances</h4>
                                            <p className="text-slate-300 leading-relaxed">
                                                {initialResult.culturalContext}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <span className="text-4xl mb-4 opacity-50">📝</span>
                                <p>No results yet.</p>
                            </div>
                        )}

                    </div>

                </div>

            </div>
        </div>
    );
}
