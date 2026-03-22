'use client';

import { useState, useEffect } from 'react';

export default function MobilePunchPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [today, setToday] = useState<any>(null);
  const [token, setToken] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      setToken(t);
      fetchToday(t);
    }
  }, []);

  const fetchToday = async (t: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/my`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      const data = await res.json();
      setToday(data.data?.today);
    } catch {}
  };

  const punch = async (type: 'in' | 'out') => {
    if (!token) { setMessage('Please login first'); setStatus('error'); return; }
    setStatus('loading');
    try {
      const endpoint = type === 'in' ? '/attendance/check-in' : '/attendance/check-out';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setMessage(data.message);
      setStatus('success');
      fetchToday(token);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Failed');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '-apple-system, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '56px', fontWeight: '800', color: 'white', letterSpacing: '-2px', lineHeight: 1 }}>{time}</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(255,255,255,0.2)' }}>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px', textAlign: 'center' }}>
            📱 Mobile Attendance
          </div>

          {today && (
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>CHECK IN</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#4ade80' }}>
                    {today.checkIn ? new Date(today.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>CHECK OUT</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#f87171' }}>
                    {today.checkOut ? new Date(today.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>HOURS</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>
                    {today.workHours ? `${today.workHours}h` : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px', textAlign: 'center', color: '#4ade80', fontSize: '13px', fontWeight: '500' }}>
              ✓ {message}
            </div>
          )}
          {status === 'error' && (
            <div style={{ background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px', textAlign: 'center', color: '#f87171', fontSize: '13px' }}>
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button onClick={() => punch('in')} disabled={status === 'loading' || !!today?.checkIn} style={{
              padding: '18px', background: today?.checkIn ? 'rgba(255,255,255,0.1)' : 'rgba(74,222,128,0.9)',
              border: 'none', borderRadius: '16px', cursor: today?.checkIn ? 'not-allowed' : 'pointer',
              color: 'white', fontSize: '15px', fontWeight: '700', transition: 'all 0.15s',
              opacity: today?.checkIn ? 0.5 : 1,
            }}>
              {status === 'loading' ? '...' : '✓ Check In'}
            </button>
            <button onClick={() => punch('out')} disabled={status === 'loading' || !today?.checkIn || !!today?.checkOut} style={{
              padding: '18px', background: (!today?.checkIn || today?.checkOut) ? 'rgba(255,255,255,0.1)' : 'rgba(248,113,113,0.9)',
              border: 'none', borderRadius: '16px', cursor: (!today?.checkIn || today?.checkOut) ? 'not-allowed' : 'pointer',
              color: 'white', fontSize: '15px', fontWeight: '700', transition: 'all 0.15s',
              opacity: (!today?.checkIn || today?.checkOut) ? 0.5 : 1,
            }}>
              {status === 'loading' ? '...' : '✗ Check Out'}
            </button>
          </div>

          {!token && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <a href="/login" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Login to use attendance →</a>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Biometric Device API
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#4ade80', wordBreak: 'break-all' }}>
            POST :5000/api/attendance/biometric-punch
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', lineHeight: 1.5 }}>
            Connect ZKTeco/Hikvision → HTTP Push → This endpoint
          </div>
        </div>
      </div>
    </div>
  );
}
