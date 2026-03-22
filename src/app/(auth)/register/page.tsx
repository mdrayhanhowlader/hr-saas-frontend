'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    companyName: '', email: '', password: '', phone: '', industry: '', size: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', form);
      const { token, user } = res.data.data;
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  } as React.CSSProperties;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(91,79,245,0.1) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', background: 'var(--accent)',
            borderRadius: '14px', marginBottom: '20px',
            boxShadow: '0 0 30px rgba(91,79,245,0.4)',
          }}>
            <svg width="26" height="26" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Create your workspace
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Set up HR management for your company
          </p>
        </div>

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#FCA5A5', padding: '12px 16px', borderRadius: '8px',
                fontSize: '13px', marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Company Name *</label>
              <input name="companyName" value={form.companyName} onChange={handleChange}
                required style={inputStyle} placeholder="Acme Corporation"
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Work Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                required style={inputStyle} placeholder="admin@company.com"
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Password *</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                required style={inputStyle} placeholder="Min. 8 characters"
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange}
                style={inputStyle} placeholder="+880 1700 000000"
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Industry</label>
                <select name="industry" value={form.industry} onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1A1A1A' }}>Select</option>
                  {['Technology','Finance','Healthcare','Education','Retail','Manufacturing','Other'].map(i => (
                    <option key={i} value={i} style={{ background: '#1A1A1A' }}>{i}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Company Size</label>
                <select name="size" value={form.size} onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1A1A1A' }}>Select</option>
                  {['1-10','11-50','51-200','201-500','500+'].map(s => (
                    <option key={s} value={s} style={{ background: '#1A1A1A' }}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? 'var(--bg-hover)' : 'var(--accent)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 20px rgba(91,79,245,0.3)',
              }}
            >
              {loading ? 'Creating workspace...' : 'Create workspace'}
            </button>
          </form>

          <div style={{
            marginTop: '24px', paddingTop: '24px',
            borderTop: '1px solid var(--border)', textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Already have a workspace?{' '}
              <a href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
