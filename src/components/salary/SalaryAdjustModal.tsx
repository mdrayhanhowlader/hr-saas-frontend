'use client';

import { useState } from 'react';
import api from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';

interface Props {
  employee: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SalaryAdjustModal({ employee, onClose, onSuccess }: Props) {
  const currentSalary = Number(employee.basicSalary);
  const [newSalary, setNewSalary] = useState(String(currentSalary));
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const newSalaryNum = Number(newSalary);
  const diff = newSalaryNum - currentSalary;
  const pct = currentSalary > 0 ? ((diff / currentSalary) * 100).toFixed(1) : '0';
  const isIncrease = diff > 0;
  const isDecrease = diff < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalaryNum || newSalaryNum <= 0) { setError('Enter a valid salary'); return; }
    if (newSalaryNum === currentSalary) { setError('New salary is same as current'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post('/salary/adjust', {
        employeeId: employee.id,
        newSalary: newSalaryNum,
        reason,
        effectiveDate,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Salary Adjustment</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{employee.firstName} {employee.lastName} · {employee.employeeId}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>৳{currentSalary.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: isIncrease ? 'var(--success)' : isDecrease ? 'var(--danger)' : 'var(--text-primary)' }}>
              ৳{newSalaryNum > 0 ? newSalaryNum.toLocaleString() : '—'}
            </div>
          </div>
        </div>

        {newSalary && newSalaryNum !== currentSalary && newSalaryNum > 0 && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px',
            background: isIncrease ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${isIncrease ? 'rgba(29,131,72,0.2)' : 'rgba(192,57,43,0.2)'}`,
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '20px' }}>{isIncrease ? 'increases' : 'decreases'}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: isIncrease ? 'var(--success)' : 'var(--danger)' }}>
                {isIncrease ? '+' : ''}৳{Math.abs(diff).toLocaleString()} ({isIncrease ? '+' : ''}{pct}%)
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {isIncrease ? 'Salary increment' : 'Salary reduction'}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>
              New Basic Salary (BDT) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input type="number" value={newSalary} onChange={e => setNewSalary(e.target.value)}
              required min="1000" placeholder="e.g. 35000" style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[20000, 25000, 30000, 35000, 40000].map(s => (
                <button key={s} type="button" onClick={() => setNewSalary(String(s))} style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
                  border: `1px solid ${Number(newSalary) === s ? 'var(--accent)' : 'var(--border)'}`,
                  background: Number(newSalary) === s ? 'var(--accent-subtle)' : 'var(--bg-input)',
                  color: Number(newSalary) === s ? 'var(--accent)' : 'var(--text-secondary)',
                }}>৳{s.toLocaleString()}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>
              Effective Date <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <DatePicker value={effectiveDate} onChange={setEffectiveDate} placeholder="Select date" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>
              Reason <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>(optional)</span>
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {['Annual increment','Performance bonus','Promotion','Market adjustment','Disciplinary'].map(r => (
                <button key={r} type="button" onClick={() => setReason(r)} style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
                  border: `1px solid ${reason === r ? 'var(--accent)' : 'var(--border)'}`,
                  background: reason === r ? 'var(--accent-subtle)' : 'var(--bg-input)',
                  color: reason === r ? 'var(--accent)' : 'var(--text-secondary)',
                }}>{r}</button>
              ))}
            </div>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="Additional notes..."
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving || !newSalary || newSalaryNum === currentSalary} style={{
              flex: 2, padding: '11px',
              background: isDecrease ? 'var(--danger)' : 'var(--success)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: 'white', fontSize: '13px', fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: (!newSalary || newSalaryNum === currentSalary) ? 0.5 : 1,
            }}>
              {saving ? 'Saving...' : isDecrease ? 'Reduce Salary' : 'Increase Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
