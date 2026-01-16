'use client';

import { useState, useRef, useEffect } from 'react';
import { translateImage } from './actions';
import { AnimatePresence, motion } from 'framer-motion';
import { jsPDF } from 'jspdf';

export default function Home() {
  // --- Global State ---
  const [files, setFiles] = useState([]); // Array of { id, file, url, rotation }
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('Auto-Detect');

  // --- Upload View State ---
  const [isDragging, setIsDragging] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const fileInputRef = useRef(null);

  // --- Translation View State ---
  const [activeTab, setActiveTab] = useState('translation');
  const [isZoomed, setIsZoomed] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  // --- Export State ---
  const [translatorName, setTranslatorName] = useState(''); // Kept for future use if needed, or default
  const [isExporting, setIsExporting] = useState(false);

  const LANGUAGES = [
    { value: 'Auto-Detect', label: '✨ Auto-Detect' },
    { value: 'English', label: '🇺🇸 English' },
    { value: 'Spanish', label: '🇪🇸 Spanish' },
    { value: 'French', label: '🇫🇷 French' },
    { value: 'Telugu', label: '🇮🇳 Telugu' },
    { value: 'Tamil', label: '🇮🇳 Tamil' },
    { value: 'Amharic', label: '🇪🇹 Amharic' },
    { value: 'Afan Oromo', label: '🇪🇹 Afan Oromo' },
  ];

  // --- Effects ---
  useEffect(() => {
    if (files.length > 0) {
      if (!selectedId || !files.find(f => f.id === selectedId)) {
        setSelectedId(files[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [files, selectedId]);

  useEffect(() => {
    if (result?.translation) {
      setEditedText(result.translation);
    }
  }, [result]);

  // --- Image Processing Helpers ---
  const processImage = (file, rotation = 0) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const radians = (rotation * Math.PI) / 180;

        if (rotation === 90 || rotation === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

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

  const loadImage = async (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  };

  // --- Handlers: Upload Flow ---
  const handleAddFiles = async (newFiles) => {
    try {
      const processed = await Promise.all(Array.from(newFiles).map(async (file) => {
        const processedFile = await processImage(file, 0);
        return {
          id: crypto.randomUUID(),
          file: processedFile,
          originalFile: file,
          url: URL.createObjectURL(processedFile),
          rotation: 0
        };
      }));
      setFiles(prev => [...prev, ...processed].slice(0, 3));
    } catch (err) {
      console.error(err);
      setError("Failed to process images.");
    }
  };

  const handleRemoveFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleReorder = (id, direction) => {
    setFiles(prev => {
      const index = prev.findIndex(f => f.id === id);
      if (index === -1) return prev;
      const newFiles = [...prev];
      if (direction === 'up' && index > 0) {
        [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
      } else if (direction === 'down' && index < newFiles.length - 1) {
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
      }
      return newFiles;
    });
  };

  const handleRotate = async (id) => {
    const fileIndex = files.findIndex(f => f.id === id);
    if (fileIndex === -1) return;
    const current = files[fileIndex];
    const newRotation = (current.rotation + 90) % 360;
    const processedFile = await processImage(current.originalFile, newRotation);
    setFiles(prev => {
      const copy = [...prev];
      copy[fileIndex] = { ...current, file: processedFile, url: URL.createObjectURL(processedFile), rotation: newRotation };
      return copy;
    });
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleAddFiles(e.dataTransfer.files);
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) handleAddFiles(e.target.files);
  };

  const handleTranslate = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setShowConfirmModal(false);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('image', f.file));
      formData.append('language', language);
      const response = await translateImage(formData);
      if (response.error) setError(response.error);
      else if (response.data) setResult(response.data);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during translation.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError(null);
    setCurrentImageIndex(0);
    setActiveTab('translation');
  };


  // --- Handlers: Export PDF ---
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      // Load Logo
      let logoImg = null;
      try {
        logoImg = await loadImage('/logo.png');
      } catch (e) { }

      // 1. Add Original Images
      for (let i = 0; i < files.length; i++) {
        if (i > 0) doc.addPage();
        const file = files[i];
        const img = await loadImage(file.url);
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;
        let renderW, renderH;
        if (imgRatio > pageRatio) {
          renderW = pageWidth - margin * 2;
          renderH = renderW / imgRatio;
        } else {
          renderH = pageHeight - margin * 2;
          renderW = renderH * imgRatio;
        }
        const x = (pageWidth - renderW) / 2;
        const y = (pageHeight - renderH) / 2;
        doc.addImage(img, 'JPEG', x, y, renderW, renderH);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Original Page ${i + 1}`, margin, margin / 2);
      }

      // 2. Add Translation Page
      doc.addPage();

      const childID = result.headerInfo?.childID || "N/A";

      // --- HEADER ---
      // Child ID at (margin, 30)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Child ID: ${childID}`, margin, 30);

      // Logo at (pageWidth - margin - 30, 15) -> 15 replaced with 10, h=30
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', pageWidth - margin - 30, 10, 30, 30);
      }

      // Title
      doc.setFontSize(18);
      doc.setTextColor(0);
      doc.text("English Translation", margin, 50);

      // --- BODY ---
      doc.setFontSize(12);
      doc.setTextColor(60);
      const contentStartY = 65;
      const maxLineWidth = pageWidth - margin * 2;
      const splitText = doc.splitTextToSize(editedText, maxLineWidth);
      doc.text(splitText, margin, contentStartY);

      // --- FOOTER ---
      const dateStr = new Date().toLocaleDateString();
      doc.setDrawColor(200);
      doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Translated by: ${translatorName || 'AI Scribe'}`, margin, pageHeight - 20);
      doc.text(`Date: ${dateStr}`, margin, pageHeight - 15);

      // 3. Save with Strict Blob Trigger & Sanitized Filename
      const finalName = (result?.headerInfo?.childID ? `Letter_${result.headerInfo.childID}.pdf` : 'Letter_Translation.pdf').replace(/[^a-zA-Z0-9\-\_.]/g, '_');

      const pdfOutput = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfOutput);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalName; // Explicitly set the name here
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // --- Render ---
  const selectedFile = files.find(f => f.id === selectedId);

  return (
    <main className="min-h-screen bg-transparent p-4 flex flex-col">
      <AnimatePresence mode="wait">
        {!result && !loading ? (
          // --- VIEW 1: UPLOAD ---
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-center w-full max-w-6xl mx-auto p-6"
          >
            <div className="text-center mb-6 space-y-2">
              <h2 className="text-3xl font-bold text-white tracking-tight">
                {files.length === 0 ? "Upload & Pre-process" : "Review & Translate"}
              </h2>
              <p className="text-slate-400">
                {files.length === 0
                  ? "Crop, rotate, and enhance your image before translation."
                  : "Ensure pages are in order and oriented correctly."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Left: Controls */}
              <div className="md:col-span-4 flex flex-col gap-6 order-2 md:order-1">
                <div className="bg-surface/50 border border-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Configuration</h3>
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                  </div>

                  {files.length > 0 && (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={loading}
                      className={`
                                    w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg transition-all
                                    ${loading
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary-light text-white hover:scale-[1.02]'}
                                `}
                    >
                      {loading ? (
                        <><span>↻</span> Processing...</>
                      ) : (
                        <><span>✨</span> Translate All ({files.length})</>
                      )}
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                  {files.length > 0 && (
                    <button onClick={() => fileInputRef.current?.click()} className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-white/20 hover:bg-white/5 text-slate-300 text-sm transition-all">
                      <span>+</span> Add More Pages
                    </button>
                  )}
                </div>
                {files.length === 0 && (
                  <div className="bg-background-dark/50 border border-white/5 p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4">Tips:</h3>
                    <ul className="space-y-3 text-sm text-slate-400">
                      <li>💡 Ensure clear handwriting.</li>
                      <li>📄 Upload multiple pages.</li>
                      <li>🔄 Rotate to be vertical.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Right: Upload/Preview */}
              <div className="md:col-span-8 order-1 md:order-2 flex flex-col gap-6">
                {files.length === 0 ? (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                                relative cursor-pointer group flex flex-col items-center justify-center h-[400px] w-full rounded-2xl border-2 border-dashed transition-all duration-300
                                ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-white/20 bg-surface/30 hover:border-white/40 hover:bg-surface/50'}
                            `}
                  >
                    <div className="flex flex-col items-center p-6 text-center">
                      <span className="text-4xl text-white/80 mb-4">☁️</span>
                      <h3 className="text-xl font-bold text-white mb-2">Click or drag files here</h3>
                      <p className="text-slate-400 max-w-xs">Supports multiple JPG, PNG, WebP</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {/* Main Preview */}
                    <div className="relative h-[500px] bg-black/40 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center">
                      {selectedFile && (
                        <>
                          <img src={selectedFile.url} alt="Preview" className="max-h-full max-w-full object-contain p-4 transition-transform duration-300" />
                          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur rounded-lg p-2 border border-white/10">
                            <button onClick={(e) => { e.stopPropagation(); handleRotate(selectedFile.id); }} className="p-2 text-white hover:text-primary hover:bg-white/10 rounded-md transition-colors" title="Rotate 90°">
                              🔄 Rotate
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {/* Thumbnails */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      <AnimatePresence initial={false}>
                        {files.map((file, index) => (
                          <motion.div
                            key={file.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => setSelectedId(file.id)}
                            className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedId === file.id ? 'border-primary ring-2 ring-primary/20' : 'border-white/10 hover:border-white/30'}`}
                          >
                            <img src={file.url} className="w-full h-full object-cover" alt={`Page ${index + 1}`} />
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-xs font-bold text-white">Page {index + 1}</div>
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex justify-between items-end opacity-0 hover:opacity-100 transition-opacity">
                              <div className="flex gap-1">
                                <button onClick={(e) => { e.stopPropagation(); handleReorder(file.id, 'up'); }} disabled={index === 0} className="p-1 hover:bg-white/20 rounded text-white disabled:opacity-30">⬆</button>
                                <button onClick={(e) => { e.stopPropagation(); handleReorder(file.id, 'down'); }} disabled={index === files.length - 1} className="p-1 hover:bg-white/20 rounded text-white disabled:opacity-30">⬇</button>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.id); }} className="p-1 hover:bg-red-500/20 text-red-400 hover:text-red-200 rounded">✕</button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {files.length < 5 && (
                        <button onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 flex flex-col items-center justify-center text-slate-400 transition-all">
                          <span className="text-2xl mb-1">+</span><span className="text-xs">Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Translations Confirm Modal */}
            <AnimatePresence>
              {showConfirmModal && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                    className="w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8"
                  >
                    <h3 className="text-2xl font-bold text-white mb-2">Confirm Translation</h3>
                    <p className="text-slate-400 mb-6">Please verify your language settings before proceeding.</p>
                    <div className="space-y-6 mb-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">From (Source)</label>
                          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary transition-colors">
                            {LANGUAGES.map(lang => (<option key={lang.value} value={lang.value}>{lang.label}</option>))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">To (Target)</label>
                          <select disabled className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed">
                            <option>🇺🇸 English</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-white transition-colors">Cancel</button>
                      <button onClick={handleTranslate} className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-light text-white font-bold shadow-lg transition-transform hover:scale-[1.02]">Confirm & Translate</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        ) : (
          // --- VIEW 2: RESULTS ---
          <motion.div
            key="translation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 h-[calc(100vh-80px)] min-h-[600px] flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
              <div>
                <h1 className="text-3xl font-bold text-white">Workspace</h1>
                <p className="text-slate-400">Deciphering your document.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors font-bold shadow-lg">
                  <span>📥</span> {isExporting ? 'Generating...' : 'Export Result'}
                </button>
                <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-white/10 hover:bg-white/5 text-white transition-colors">
                  <span>🔄</span> Change Image
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
              {/* Left Column: Image Preview */}
              <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl overflow-hidden relative group flex flex-col">
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  {isZoomed ? (
                    <button onClick={() => setIsZoomed(false)} className="px-3 py-1 bg-black/70 backdrop-blur text-white rounded-lg text-sm border border-white/10 hover:bg-black/90">Zoom Out</button>
                  ) : (
                    <button onClick={() => setIsZoomed(true)} className="px-3 py-1 bg-black/70 backdrop-blur text-white rounded-lg text-sm border border-white/10 hover:bg-black/90">Zoom In</button>
                  )}
                </div>
                {files.length > 1 && (
                  <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button onClick={prevImage} className="p-2 bg-black/70 backdrop-blur text-white rounded-lg border border-white/10 hover:bg-black/90">←</button>
                    <span className="px-3 py-2 bg-black/70 backdrop-blur text-white rounded-lg border border-white/10 font-mono text-sm">{currentImageIndex + 1}/{files.length}</span>
                    <button onClick={nextImage} className="p-2 bg-black/70 backdrop-blur text-white rounded-lg border border-white/10 hover:bg-black/90">→</button>
                  </div>
                )}
                <div className="flex-1 overflow-auto flex items-center justify-center p-4 custom-scrollbar">
                  {isZoomed ? (
                    <img src={files[currentImageIndex].url} alt="Original document" className="w-full h-auto cursor-zoom-out" onClick={() => setIsZoomed(false)} />
                  ) : (
                    <img src={files[currentImageIndex].url} alt="Original document" className="max-w-full max-h-full object-contain cursor-zoom-in shadow-2xl" onClick={() => setIsZoomed(true)} />
                  )}
                </div>
              </div>

              {/* Right Column: Information Tabs */}
              <div className="flex-1 bg-surface/30 border border-white/10 rounded-2xl flex flex-col overflow-hidden backdrop-blur-md">
                <div className="flex border-b border-white/10">
                  {[
                    { id: 'translation', label: 'Translation', icon: '📝' },
                    { id: 'transcription', label: 'Original', icon: '🔡' },
                    { id: 'cultural', label: 'Context', icon: '💡' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 py-4 px-6 text-sm font-bold tracking-wide transition-all border-b-2 ${activeTab === tab.id ? 'border-primary text-white bg-white/5' : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <span className="mr-2">{tab.icon}</span>{tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                  {activeTab === 'translation' && (
                    <div className="prose prose-invert max-w-none">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-primary">English Translation</h3>
                        <button onClick={() => setIsEditing(!isEditing)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${isEditing ? 'bg-primary text-white border-primary' : 'border-white/20 text-slate-400 hover:text-white'}`}>
                          {isEditing ? 'Done Editing' : 'Edit Text'}
                        </button>
                      </div>
                      {isEditing ? (
                        <textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full h-[400px] bg-black/30 border border-white/10 rounded-lg p-4 text-slate-200 focus:border-primary focus:outline-none resize-none font-serif leading-relaxed"
                        />
                      ) : (
                        <div className="text-slate-200 leading-relaxed font-serif whitespace-pre-wrap">{editedText}</div>
                      )}
                    </div>
                  )}
                  {activeTab === 'transcription' && (
                    <div className="prose prose-invert max-w-none">
                      <h3 className="text-xl font-bold text-blue-300 mb-4">Original Script</h3>
                      <div className="text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-black/20 p-4 rounded-lg border border-white/5">
                        {result?.originalTranscription}
                      </div>
                    </div>
                  )}
                  {activeTab === 'cultural' && (
                    <div className="prose prose-invert max-w-none">
                      <h3 className="text-xl font-bold text-amber-300 mb-4">Cultural Notes</h3>
                      <ul className="space-y-4">
                        {result?.culturalContext?.map((note, i) => (
                          <li key={i} className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                            <span className="text-amber-200 font-bold block mb-1">Note {i + 1}</span>
                            <span className="text-slate-300">{note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>



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
