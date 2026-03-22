'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const isAdmin = ['HR_ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user?.role || '');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', priority: 'normal' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/announcements', form);
      setShowModal(false);
      setForm({ title: '', content: '', priority: 'normal' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchData();
    } catch {}
  };

  const priorityStyle: any = {
    high: { bg: 'var(--danger-bg)', color: 'var(--danger)', border: 'rgba(255,69,58,0.15)', label: 'High Priority', dot: 'var(--danger)' },
    medium: { bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'rgba(255,159,10,0.15)', label: 'Medium', dot: 'var(--warning)' },
    normal: { bg: 'var(--accent-subtle)', color: 'var(--accent)', border: 'rgba(41,151,255,0.15)', label: 'Normal', dot: 'var(--accent)' },
  };

  const inputStyle = { width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Announcements</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Company-wide notices and updates</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-glow)' }}>
            + New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', marginBottom: '12px' }} />)}</div>
      ) : announcements.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📢</div>
          <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>No announcements yet</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Post your first announcement to inform the team' : 'No announcements from HR yet'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {announcements.map((ann: any) => {
            const ps = priorityStyle[ann.priority] || priorityStyle.normal;
            return (
              <div key={ann.id} style={{ background: 'var(--bg-card)', border: `1px solid ${ps.border}`, borderRadius: 'var(--radius-md)', padding: '20px', borderLeft: `3px solid ${ps.dot}`, transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '600', background: ps.bg, color: ps.color }}>{ps.label}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.3 }}>{ann.title}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => handleDelete(ann.id)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', borderRadius: '6px', flexShrink: 0, transition: 'color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--danger)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" strokeWidth="1.5"/><path strokeWidth="1.5" strokeLinecap="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>New Announcement</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Visible to all employees</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Announcement title" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Priority</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['normal', 'medium', 'high'].map(p => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })} style={{
                      flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                      border: form.priority === p ? `1px solid ${priorityStyle[p].dot}` : '1px solid var(--border)',
                      background: form.priority === p ? priorityStyle[p].bg : 'var(--bg-input)',
                      color: form.priority === p ? priorityStyle[p].color : 'var(--text-secondary)',
                      fontSize: '12px', fontWeight: '500', cursor: 'pointer', textTransform: 'capitalize',
                    }}>{p}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Content *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required rows={5} placeholder="Write your announcement..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Posting...' : '📢 Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
