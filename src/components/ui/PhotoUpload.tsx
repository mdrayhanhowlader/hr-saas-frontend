'use client';

import { useState, useRef } from 'react';
import { uploadFile } from '@/lib/api';

interface PhotoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  size?: number;
  initials?: string;
}

export default function PhotoUpload({ value, onChange, size = 80, initials = '?' }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err: any) {
      alert(err.message || 'Upload failed. Max 10MB.');
    } finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: '50%',
          position: 'relative', cursor: uploading ? 'wait' : 'pointer',
          overflow: 'hidden',
          border: `2px dashed ${dragOver ? 'var(--accent)' : value ? 'transparent' : 'var(--border-medium)'}`,
          transition: 'all 0.2s',
          boxShadow: dragOver ? 'var(--shadow-glow)' : 'none',
        }}
      >
        {value ? (
          <img src={value} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: `${size * 0.35}px`, fontWeight: '700', color: 'white',
          }}>
            {initials}
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="photo-overlay"
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '4px',
            opacity: uploading ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { if (!uploading) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          onMouseLeave={e => { if (!uploading) (e.currentTarget as HTMLElement).style.opacity = '0'; }}
        >
          {uploading ? (
            <div style={{ width: '22px', height: '22px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <>
              <svg width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeWidth="1.5" strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <span style={{ fontSize: '10px', color: 'white', fontWeight: '500' }}>Change</span>
            </>
          )}
        </div>
      </div>

      {value && (
        <button
          onClick={e => { e.stopPropagation(); onChange(''); }}
          style={{ fontSize: '11px', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
        >
          Remove photo
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
      />

      <style>{`.photo-overlay:hover { opacity: 1 !important; }`}</style>
    </div>
  );
}
