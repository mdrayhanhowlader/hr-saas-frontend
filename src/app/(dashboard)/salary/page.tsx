'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import SalaryAdjustModal from '@/components/salary/SalaryAdjustModal';
import DatePicker from '@/components/ui/DatePicker';

export default function SalaryPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [bulkPct, setBulkPct] = useState('10');
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkReason, setBulkReason] = useState('Annual increment');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees?limit=100');
      setEmployees(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeId}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(e => e.id));

  const handleBulkAdjust = async () => {
    if (selectedIds.length === 0) return;
    setBulkSaving(true);
    try {
      const adjustments = selectedIds.map(id => {
        const emp = employees.find(e => e.id === id);
        const current = Number(emp.basicSalary);
        const newSalary = Math.round(current * (1 + Number(bulkPct) / 100));
        return { employeeId: id, newSalary };
      });
      await api.post('/salary/bulk-adjust', { adjustments, reason: bulkReason, effectiveDate: bulkDate });
      alert(`${selectedIds.length} employee salaries updated`);
      setSelectedIds([]);
      setShowBulk(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setBulkSaving(false); }
  };

  const inputStyle = {
    padding: '9px 12px', background: 'var(--bg-input)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
      {selected && <SalaryAdjustModal employee={selected} onClose={() => setSelected(null)} onSuccess={() => { fetchEmployees(); setSelected(null); }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Salary Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Adjust individual or bulk salaries</p>
        </div>
        {selectedIds.length > 0 && (
          <button onClick={() => setShowBulk(true)} style={{ padding: '9px 16px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Bulk Adjust ({selectedIds.length})
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Employees', value: employees.length, color: 'var(--accent)' },
          { label: 'Total Basic', value: `৳${employees.reduce((s, e) => s + Number(e.basicSalary), 0).toLocaleString()}`, color: 'var(--text-primary)' },
          { label: 'Est. Gross Payroll', value: `৳${Math.round(employees.reduce((s, e) => s + Number(e.basicSalary) * 1.6, 0)).toLocaleString()}`, color: 'var(--success)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..."
          style={{ ...inputStyle, width: '280px' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '11px 16px', width: '40px' }}>
                <input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
              </th>
              {['Employee', 'Department', 'Basic Salary', 'Est. Gross', 'Action'].map(h => (
                <th key={h} style={{ padding: '11px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={6} style={{ padding: '12px 16px' }}><div className="skeleton" style={{ height: '36px' }} /></td></tr>
              ))
            ) : filtered.map(emp => (
              <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <td style={{ padding: '12px 16px' }}>
                  <input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={() => toggleSelect(emp.id)}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `hsl(${(emp.firstName?.charCodeAt(0) || 0) * 15 % 360}, 55%, 40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{emp.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.department?.name || '—'}</td>
                <td style={{ padding: '12px 12px', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>৳{Number(emp.basicSalary).toLocaleString()}</td>
                <td style={{ padding: '12px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>৳{Math.round(Number(emp.basicSalary) * 1.6).toLocaleString()}</td>
                <td style={{ padding: '12px 12px' }}>
                  <button onClick={() => setSelected(emp)} style={{ padding: '6px 12px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-glow)', borderRadius: '6px', color: 'var(--accent)', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                    Adjust
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBulk && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Bulk Salary Adjustment</h2>
              <button onClick={() => setShowBulk(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>

            <div style={{ padding: '12px 14px', background: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '13px', color: 'var(--accent)' }}>
              Adjusting {selectedIds.length} employees
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Increment %</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="number" value={bulkPct} onChange={e => setBulkPct(e.target.value)} min="-50" max="100"
                  style={{ ...inputStyle, width: '80px' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                <span style={{ color: 'var(--text-secondary)' }}>%</span>
                {[5,10,15,20].map(p => (
                  <button key={p} onClick={() => setBulkPct(String(p))} style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${bulkPct === String(p) ? 'var(--accent)' : 'var(--border)'}`, background: bulkPct === String(p) ? 'var(--accent-subtle)' : 'var(--bg-input)', color: bulkPct === String(p) ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>{p}%</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Effective Date</label>
              <DatePicker value={bulkDate} onChange={setBulkDate} placeholder="Select date" />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Reason</label>
              <input value={bulkReason} onChange={e => setBulkReason(e.target.value)} style={{ ...inputStyle, width: '100%' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>

            <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '16px', maxHeight: '150px', overflowY: 'auto' }}>
              {selectedIds.map(id => {
                const emp = employees.find(e => e.id === id);
                const cur = Number(emp?.basicSalary || 0);
                const newS = Math.round(cur * (1 + Number(bulkPct) / 100));
                return (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{emp?.firstName} {emp?.lastName}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>৳{cur.toLocaleString()} → <strong style={{ color: Number(bulkPct) >= 0 ? 'var(--success)' : 'var(--danger)' }}>৳{newS.toLocaleString()}</strong></span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowBulk(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleBulkAdjust} disabled={bulkSaving} style={{ flex: 2, padding: '11px', background: Number(bulkPct) >= 0 ? 'var(--success)' : 'var(--danger)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                {bulkSaving ? 'Adjusting...' : `Apply to ${selectedIds.length} Employees`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
