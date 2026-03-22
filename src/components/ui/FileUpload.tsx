'use client';

import { useState, useRef } from 'react';
import { uploadFile } from '@/lib/api';

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  required?: boolean;
  accept?: string;
}

export default function FileUpload({ value, onChange, label, required = false, accept = '.pdf,.jpg,.jpeg,.png' }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
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
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const filename = value ? value.split('/').pop()?.split('_').slice(2).join('_') || 'Uploaded file' : '';

  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>
        {label}
        {required
          ? <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>
          : <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginLeft: '4px' }}>(optional)</span>
        }
      </label>

      {value ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px',
          background: 'var(--success-bg)',
          border: '1px solid rgba(50,215,75,0.2)',
          borderRadius: 'var(--radius-sm)',
        }}>
          <svg width="16" height="16" fill="none" stroke="var(--success)" viewBox="0 0 24 24">
            <path strokeWidth="1.5" strokeLinecap="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span style={{ flex: 1, fontSize: '12px', color: 'var(--success)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Uploaded successfully
          </span>
          <a href={value} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none' }}>View</a>
          <button
            onClick={() => onChange('')}
            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
          >×</button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)'; }}
          onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-input)'; }}
          onDrop={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-input)'; handleDrop(e); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px',
            background: 'var(--bg-input)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-sm)',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!uploading) { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'; }}}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-input)'; }}
        >
          {uploading ? (
            <div style={{ width: '16px', height: '16px', border: '2px solid var(--border-medium)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          ) : (
            <svg width="16" height="16" fill="none" stroke="var(--text-tertiary)" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeWidth="1.5" strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
          )}
          <div>
            <div style={{ fontSize: '12px', color: uploading ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: '500' }}>
              {uploading ? 'Uploading...' : 'Click or drag to upload'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>
              PDF, JPG, PNG — max 10MB
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}
