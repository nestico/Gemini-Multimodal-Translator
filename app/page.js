'use client';

import { useState } from 'react';
import { translateImage } from './actions';

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', file);

    const response = await translateImage(formData);

    if (response.error) {
      setError(response.error);
      if (response.error.includes("API_KEY_MISSING")) {
        // Optional: Auto-fill mock data for demo purposes if key is missing (for verification audit)
        // Uncomment below line to enable mock mode for UI testing without key
        // triggerMockSuccess(); 
      }
    } else if (response.success) {
      setResult(response.data);
    }

    setLoading(false);
  };

  // Helper for UI testing/verification without API cost/access
  const triggerMockSuccess = () => {
    setResult({
      nativeScript: "SAMPLE AMHARIC SCRIPT HERE",
      culturalContext: "This is a formal greeting used in...",
      translation: "Greetings, respected sir..."
    });
  };

  return (
    <div className="container">
      <header style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #bbb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
          Gemini Multimodal Translator
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Amharic & Telugu Direct Translation</p>
      </header>

      <main className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto', transition: 'all 0.3s ease' }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
          <div
            style={{
              border: '2px dashed rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius)',
              padding: '3rem',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'border-color 0.2s, background 0.2s',
              background: preview ? 'rgba(0,0,0,0.2)' : 'transparent'
            }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              if (e.dataTransfer.files[0]) {
                setFile(e.dataTransfer.files[0]);
                setPreview(URL.createObjectURL(e.dataTransfer.files[0]));
              }
            }}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {preview ? (
              <div className="animate-fade-in">
                <img src={preview} alt="Preview" style={{ maxHeight: '400px', maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Click to change image</p>
              </div>
            ) : (
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📁</div>
                <p style={{ marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 500 }}>Click or Drag to Upload letter</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Supports JPG, PNG, WebP</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button type="submit" className="btn-primary" disabled={loading || !file} style={{ minWidth: '240px', fontSize: '1.1rem' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  Processing via Gemini 2.5 Flash...
                </span>
              ) : 'Translate Image'}
            </button>
          </div>

          <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </form>

        {error && (
          <div style={{ background: 'rgba(255, 50, 50, 0.1)', border: '1px solid rgba(255, 50, 50, 0.3)', padding: '1rem', borderRadius: 'var(--radius)', color: '#ff8888', marginBottom: '2rem', textAlign: 'center' }}>
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in">
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '2rem 0' }}></div>

            <div className="grid-cols-2" style={{ gap: '2rem', alignItems: 'start' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary-glow)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>✍️</span> Native Script
                </h3>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.1rem', fontFamily: 'serif' }}>{result.nativeScript}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ marginBottom: '1rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🇬🇧</span> English Translation
                </h3>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.1rem' }}>{result.translation}</div>
              </div>
            </div>

            {result.culturalContext && (
              <div style={{ marginTop: '2rem', background: 'rgba(250, 200, 100, 0.05)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid rgba(250, 200, 100, 0.1)' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, color: '#fcd34d' }}>Cultural Context & Notes</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{result.culturalContext}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
