'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const PERIODS = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)', 'H1 (Jan-Jun)', 'H2 (Jul-Dec)', 'Annual'];
const RATINGS = [
  { value: 5, label: 'Outstanding', color: '#1D8348', bg: 'rgba(29,131,72,0.1)' },
  { value: 4, label: 'Exceeds Expectations', color: '#117A8B', bg: 'rgba(17,122,139,0.1)' },
  { value: 3, label: 'Meets Expectations', color: '#B7770D', bg: 'rgba(183,119,13,0.1)' },
  { value: 2, label: 'Needs Improvement', color: '#C0392B', bg: 'rgba(192,57,43,0.1)' },
  { value: 1, label: 'Unsatisfactory', color: '#922B21', bg: 'rgba(146,43,33,0.1)' },
];

export default function PerformancePage() {
  const { user } = useAuthStore();
  const isAdmin = ['HR_ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user?.role || '');
  const [reviews, setReviews] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  const [form, setForm] = useState({
    employeeId: '', period: 'Q1 (Jan-Mar)',
    year: new Date().getFullYear(), rating: 3,
    goals: '', achievements: '', improvements: '', comments: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes] = await Promise.all([api.get('/performance/my')]);
      setMyReviews(myRes.data.data || []);

      if (isAdmin) {
        const [allRes, empRes] = await Promise.all([
          api.get(`/performance?year=${year}`),
          api.get('/employees?limit=100'),
        ]);
        setReviews(allRes.data.data || []);
        setEmployees(empRes.data.data || []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [isAdmin, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/performance', form);
      setShowModal(false);
      setForm({ employeeId: '', period: 'Q1 (Jan-Mar)', year: new Date().getFullYear(), rating: 3, goals: '', achievements: '', improvements: '', comments: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.put(`/performance/${id}/acknowledge`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const getRatingInfo = (r: number) => RATINGS.find(x => x.value === r) || RATINGS[2];

  const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1,2,3,4,5].map(s => (
        <div key={s} onClick={() => onChange?.(s)}
          style={{ fontSize: '20px', cursor: onChange ? 'pointer' : 'default', transition: 'transform 0.1s', lineHeight: 1 }}
          onMouseEnter={e => onChange && ((e.currentTarget as HTMLElement).style.transform = 'scale(1.2)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
        >
          {s <= value ? '★' : '☆'}
        </div>
      ))}
    </div>
  );

  const ReviewCard = ({ r, showEmployee = false }: { r: any; showEmployee?: boolean }) => {
    const ri = getRatingInfo(r.rating);
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '20px',
        cursor: 'pointer', transition: 'all 0.15s',
        borderLeft: `3px solid ${ri.color}`,
      }}
      onClick={() => setShowDetail(r)}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            {showEmployee && r.employee && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `hsl(${(r.employee.firstName?.charCodeAt(0) || 0) * 15 % 360}, 55%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white' }}>
                  {r.employee.firstName?.[0]}{r.employee.lastName?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{r.employee.firstName} {r.employee.lastName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{r.employee.department?.name || r.employee.designation}</div>
                </div>
              </div>
            )}
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{r.period} · {r.year}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '26px', fontWeight: '800', color: ri.color, lineHeight: 1, marginBottom: '4px' }}>{r.rating}<span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>/5</span></div>
            <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: ri.bg, color: ri.color }}>{ri.label}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <StarRating value={r.rating} />
          <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500',
            background: r.status === 'ACKNOWLEDGED' ? 'var(--success-bg)' : r.status === 'SUBMITTED' ? 'var(--accent-subtle)' : 'rgba(100,100,100,0.1)',
            color: r.status === 'ACKNOWLEDGED' ? 'var(--success)' : r.status === 'SUBMITTED' ? 'var(--accent)' : 'var(--text-secondary)',
          }}>{r.status}</span>
        </div>

        {r.goals && (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            <span style={{ color: 'var(--text-tertiary)', fontWeight: '500' }}>Goals: </span>{r.goals}
          </div>
        )}

        {r.status === 'SUBMITTED' && !isAdmin && (
          <button onClick={e => { e.stopPropagation(); handleAcknowledge(r.id); }} style={{
            marginTop: '12px', padding: '7px 14px', background: 'var(--success-bg)',
            border: '1px solid rgba(29,131,72,0.2)', borderRadius: 'var(--radius-sm)',
            color: 'var(--success)', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}>
            ✓ Acknowledge Review
          </button>
        )}
      </div>
    );
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none',
  };

  const displayReviews = activeTab === 'all' ? reviews : myReviews;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Performance Reviews</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Track and manage employee performance</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdmin && (
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              {[2024,2025,2026,2027].map(y => <option key={y} value={y} style={{ background: 'var(--bg-card)' }}>{y}</option>)}
            </select>
          )}
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{
              padding: '9px 16px', background: 'var(--accent)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px',
              fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-glow)',
            }}>
              + Create Review
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px', width: 'fit-content' }}>
          {[{ id: 'all', label: `All Reviews (${reviews.length})` }, { id: 'my', label: 'My Reviews' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
              padding: '6px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--bg-base)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? '500' : '400',
            }}>{tab.label}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '160px' }} />)}
        </div>
      ) : displayReviews.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📈</div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>No performance reviews yet</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isAdmin ? 'Click "Create Review" to evaluate an employee' : 'Your reviews will appear here'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {displayReviews.map((r: any) => (
            <ReviewCard key={r.id} r={r} showEmployee={activeTab === 'all' && isAdmin} />
          ))}
        </div>
      )}

      {/* Create Review Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Create Performance Review</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Employee will be notified after submission</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Employee <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                    <option value="" style={{ background: 'var(--bg-card)' }}>Select employee</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id} style={{ background: 'var(--bg-card)' }}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Period <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                    {PERIODS.map(p => <option key={p} value={p} style={{ background: 'var(--bg-card)' }}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Year <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                    {[2024,2025,2026,2027].map(y => <option key={y} value={y} style={{ background: 'var(--bg-card)' }}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '10px' }}>Rating <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  {[1,2,3,4,5].map(s => (
                    <div key={s} onClick={() => setForm({ ...form, rating: s })} style={{
                      fontSize: '28px', cursor: 'pointer',
                      color: s <= form.rating ? '#F59E0B' : 'var(--border-strong)',
                      transition: 'all 0.1s', lineHeight: 1,
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1.2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(1)'}
                    >★</div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '500', background: getRatingInfo(form.rating).bg, color: getRatingInfo(form.rating).color }}>
                    {getRatingInfo(form.rating).label}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{form.rating} out of 5</span>
                </div>
              </div>

              {[
                { key: 'goals', label: 'Goals & Objectives', placeholder: 'What were the employee\'s goals for this period?' },
                { key: 'achievements', label: 'Key Achievements', placeholder: 'What did the employee accomplish?' },
                { key: 'improvements', label: 'Areas for Improvement', placeholder: 'What can the employee improve?' },
                { key: 'comments', label: 'Additional Comments', placeholder: 'Any other feedback...' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>{f.label}</label>
                  <textarea value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    rows={3} placeholder={f.placeholder} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              ))}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving || !form.employeeId} style={{ flex: 2, padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: saving || !form.employeeId ? 'not-allowed' : 'pointer', opacity: !form.employeeId ? 0.6 : 1 }}>
                  {saving ? 'Submitting...' : '📊 Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowDetail(null)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {showDetail.period} {showDetail.year} Review
                </h2>
                {showDetail.employee && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {showDetail.employee.firstName} {showDetail.employee.lastName}
                  </div>
                )}
              </div>
              <button onClick={() => setShowDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', fontWeight: '800', color: getRatingInfo(showDetail.rating).color, lineHeight: 1 }}>{showDetail.rating}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: getRatingInfo(showDetail.rating).color }}>{getRatingInfo(showDetail.rating).label}</div>
                <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '16px', color: s <= showDetail.rating ? '#F59E0B' : 'var(--border-strong)' }}>★</span>)}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: '500',
                  background: showDetail.status === 'ACKNOWLEDGED' ? 'var(--success-bg)' : 'var(--accent-subtle)',
                  color: showDetail.status === 'ACKNOWLEDGED' ? 'var(--success)' : 'var(--accent)',
                }}>{showDetail.status}</span>
              </div>
            </div>

            {[
              { label: 'Goals & Objectives', value: showDetail.goals },
              { label: 'Key Achievements', value: showDetail.achievements },
              { label: 'Areas for Improvement', value: showDetail.improvements },
              { label: 'Additional Comments', value: showDetail.comments },
            ].filter(s => s.value).map(section => (
              <div key={section.label} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{section.label}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, padding: '12px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  {section.value}
                </div>
              </div>
            ))}

            {showDetail.status === 'SUBMITTED' && !isAdmin && (
              <button onClick={() => { handleAcknowledge(showDetail.id); setShowDetail(null); }} style={{ width: '100%', padding: '11px', background: 'var(--success)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>
                ✓ Acknowledge This Review
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
