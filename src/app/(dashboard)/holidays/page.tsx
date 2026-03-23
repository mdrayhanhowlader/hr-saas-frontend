'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function HolidaysPage() {
  const { user } = useAuthStore();
  const isAdmin = ['HR_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', type: 'public' });
  const [saving, setSaving] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/holidays?year=${year}`);
      setHolidays(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/holidays', form);
      setShowModal(false);
      setForm({ name: '', date: '', type: 'public' });
      fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this holiday?')) return;
    try {
      await api.delete(`/holidays/${id}`);
      fetchHolidays();
    } catch {}
  };

  const handleImport = async () => {
    setImportLoading(true);
    try {
      const res = await api.post(`/holidays/import?year=${year}`);
      alert(res.data.message);
      fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setImportLoading(false); }
  };

  const typeStyle: any = {
    public: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'Public' },
    optional: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Optional' },
    company: { bg: 'var(--accent-subtle)', color: 'var(--accent)', label: 'Company' },
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y: number, m: number) => new Date(y, m, 1).getDay();

  const monthHolidays = holidays.filter(h => new Date(h.date).getMonth() === viewMonth);
  const holidayDates = new Set(monthHolidays.map(h => new Date(h.date).getDate()));

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none',
  };

  const daysInMonth = getDaysInMonth(year, viewMonth);
  const firstDay = getFirstDay(year, viewMonth);
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const today = new Date();

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Holiday Calendar</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{holidays.length} holidays in {year}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} style={{ background: 'var(--bg-card)' }}>{y}</option>)}
          </select>
          {isAdmin && (
            <button onClick={handleImport} disabled={importLoading} style={{ padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
              {importLoading ? '...' : '📥 Import BD Holidays'}
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={{ padding: '9px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              + Add Holiday
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        <div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <button onClick={() => setViewMonth(m => m === 0 ? 11 : m - 1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px', padding: '2px 8px' }}>‹</button>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{MONTH_FULL[viewMonth]} {year}</h2>
              <button onClick={() => setViewMonth(m => m === 11 ? 0 : m + 1)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px', padding: '2px 8px' }}>›</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '12px 16px 4px' }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', letterSpacing: '0.05em', padding: '4px 0' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '4px 16px 16px', gap: '2px' }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === year;
                const isHoliday = holidayDates.has(day);
                const isFriday = new Date(year, viewMonth, day).getDay() === 5;
                const isSunday = new Date(year, viewMonth, day).getDay() === 0;
                const holiday = monthHolidays.find(h => new Date(h.date).getDate() === day);
                return (
                  <div key={i} style={{
                    textAlign: 'center', padding: '8px 4px', borderRadius: '8px',
                    background: isToday ? 'var(--accent)' : isHoliday ? 'var(--danger-bg)' : isFriday || isSunday ? 'rgba(100,100,100,0.08)' : 'transparent',
                    border: isHoliday ? '1px solid rgba(255,69,58,0.2)' : '1px solid transparent',
                    cursor: 'default',
                  }} title={holiday?.name || ''}>
                    <span style={{
                      fontSize: '13px', fontWeight: isToday || isHoliday ? '600' : '400',
                      color: isToday ? 'white' : isHoliday ? 'var(--danger)' : isFriday || isSunday ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    }}>{day}</span>
                    {isHoliday && !isToday && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--danger)', margin: '2px auto 0' }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '16px', padding: '12px 20px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {[
                { color: 'var(--danger)', label: 'Holiday' },
                { color: 'var(--accent)', label: 'Today' },
                { color: 'var(--text-tertiary)', label: 'Weekend' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {MONTHS.map((m, i) => (
              <button key={m} onClick={() => setViewMonth(i)} style={{
                padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px',
                background: viewMonth === i ? 'var(--accent-subtle)' : 'var(--bg-card)',
                color: viewMonth === i ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${viewMonth === i ? 'rgba(41,151,255,0.2)' : 'var(--border)'}`,
                cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: viewMonth === i ? '500' : '400',
              }}>{m}</button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {MONTH_FULL[viewMonth]} ({monthHolidays.length})
            </h3>
          </div>
          {loading ? (
            <div style={{ padding: '20px' }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '44px', marginBottom: '8px' }} />)}</div>
          ) : monthHolidays.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>No holidays this month</div>
          ) : (
            <div>
              {monthHolidays.map((h: any) => {
                const ts = typeStyle[h.type] || typeStyle.public;
                return (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: ts.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: ts.color }}>{new Date(h.date).getDate()}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' })} · <span style={{ color: ts.color }}>{ts.label}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDelete(h.id)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', borderRadius: '6px', flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--danger)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
                      >
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" strokeWidth="1.5"/><path strokeWidth="1.5" strokeLinecap="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Add Holiday</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Holiday Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Eid ul-Fitr" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })} placeholder="Select date" />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ value: 'public', label: 'Public' }, { value: 'optional', label: 'Optional' }, { value: 'company', label: 'Company' }].map(t => (
                    <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })} style={{
                      flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${form.type === t.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.type === t.value ? 'var(--accent-subtle)' : 'var(--bg-input)',
                      color: form.type === t.value ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                    }}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving || !form.date} style={{ flex: 2, padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {saving ? 'Adding...' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
