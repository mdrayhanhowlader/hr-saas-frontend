'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editItem) {
        await api.put(`/departments/${editItem.id}`, form);
      } else {
        await api.post('/departments', form);
      }
      setShowModal(false);
      setEditItem(null);
      setForm({ name: '', description: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const openEdit = (dept: any) => {
    setEditItem(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setError('');
    setShowModal(true);
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none',
  };

  const COLORS = ['var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--purple)', 'var(--teal)'];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Departments</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{departments.length} departments</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm({ name: '', description: '' }); setError(''); setShowModal(true); }} style={{
          padding: '9px 16px', background: 'var(--accent)', color: 'white',
          border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px',
          fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-glow)',
        }}>
          + Add Department
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '120px' }} />)}
        </div>
      ) : departments.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏢</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>No departments yet</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Create departments to organize your team</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {departments.map((dept: any, i) => (
            <div key={dept.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '20px',
              borderTop: `3px solid ${COLORS[i % COLORS.length]}`,
              transition: 'all 0.15s', cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            onClick={() => router.push(`/employees?department=${dept.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${COLORS[i % COLORS.length]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  🏢
                </div>
                <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(dept)} style={{ padding: '5px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(dept.id)} style={{ padding: '5px 8px', background: 'var(--danger-bg)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: '6px', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{dept.name}</div>
              {dept.description && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>{dept.description}</div>}
              <div style={{ fontSize: '12px', color: COLORS[i % COLORS.length], fontWeight: '500' }}>
                {dept._count?.employees || 0} employees
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{editItem ? 'Edit' : 'Add'} Department</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>
            {error && <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid rgba(255,69,58,0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Department Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Engineering" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Description <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>(optional)</span></label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What does this department do?" style={{ ...inputStyle, resize: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
