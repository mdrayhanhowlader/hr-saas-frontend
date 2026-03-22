'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=15');
      setNotifications(res.data.data.notifications || []);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    setOpen(!open);
    if (!open) fetchNotifications();
  };

  const handleRead = async (n: Notification) => {
    if (!n.isRead) {
      await api.put(`/notifications/${n.id}/read`).catch(() => {});
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    await api.put('/notifications/mark-all-read').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
    const deleted = notifications.find(n => n.id === id);
    if (deleted && !deleted.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const typeIcon: any = {
    success: { icon: '✓', color: 'var(--success)', bg: 'var(--success-bg)' },
    error: { icon: '✗', color: 'var(--danger)', bg: 'var(--danger-bg)' },
    warning: { icon: '⚠', color: 'var(--warning)', bg: 'var(--warning-bg)' },
    info: { icon: 'ℹ', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        style={{
          position: 'relative', background: open ? 'var(--bg-card)' : 'none',
          border: open ? '1px solid var(--border)' : '1px solid transparent',
          borderRadius: '8px', padding: '7px', cursor: 'pointer',
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}}
        onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'; }}}
      >
        <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="1.5" strokeLinecap="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: '4px', right: '4px',
            width: unreadCount > 9 ? '18px' : '14px', height: '14px',
            background: 'var(--danger)', borderRadius: '7px',
            fontSize: '9px', fontWeight: '700', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid var(--bg-elevated)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200,
          width: '360px', background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{ padding: '1px 6px', background: 'var(--danger)', borderRadius: 'var(--radius-full)', fontSize: '10px', fontWeight: '700', color: 'white' }}>
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => {
                const ti = typeIcon[n.type] || typeIcon.info;
                return (
                  <div key={n.id}
                    onClick={() => handleRead(n)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '12px 16px', cursor: 'pointer',
                      background: n.isRead ? 'transparent' : 'rgba(41,151,255,0.04)',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.1s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.isRead ? 'transparent' : 'rgba(41,151,255,0.04)'}
                  >
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: ti.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: ti.color, flexShrink: 0, fontWeight: '700' }}>
                      {ti.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: n.isRead ? '400' : '600', color: 'var(--text-primary)', marginBottom: '2px', lineHeight: 1.3 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '4px' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                      {!n.isRead && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} />}
                      <button onClick={e => handleDelete(e, n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px', fontSize: '14px', opacity: 0.6, transition: 'opacity 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.6'}
                      >×</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
