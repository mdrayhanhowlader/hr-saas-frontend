'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';

export default function LeavesPage() {
  const { user } = useAuthStore();
  const isAdmin = ['HR_ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user?.role || '');

  const [requests, setRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<any>(null);
  const [overrideBalance, setOverrideBalance] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [typeRes, balRes] = await Promise.all([
        api.get('/leaves/types'),
        api.get('/leaves/balances'),
      ]);
      setLeaveTypes(typeRes.data.data || []);
      setBalances(balRes.data.data || []);

      if (isAdmin && activeTab === 'all') {
        const reqRes = await api.get('/leaves');
        setRequests(reqRes.data.data || []);
      } else {
        const reqRes = await api.get('/leaves/my');
        setRequests(reqRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedLeaveType = leaveTypes.find(t => t.id === form.leaveTypeId);
  const selectedBalance = balances.find(b => b.leaveTypeId === form.leaveTypeId);

  const calcDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    const diff = new Date(form.endDate).getTime() - new Date(form.startDate).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const requestedDays = calcDays();
  const hasEnoughBalance = selectedBalance ? selectedBalance.remaining >= requestedDays : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/leaves', form);
      setShowModal(false);
      setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (id: string, status: string, isOverride?: boolean) => {
    setActionLoading(id);
    try {
      await api.put(`/leaves/${id}/status`, { status, overrideBalance: isOverride });
      fetchData();
      setShowApproveModal(null);
      setOverrideBalance(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInitialize = async () => {
    setInitLoading(true);
    try {
      const res = await api.post('/leaves/initialize');
      alert(`✓ ${res.data.message}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setInitLoading(false);
    }
  };

  const statusStyle: any = {
    PENDING: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Pending' },
    APPROVED: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Approved' },
    REJECTED: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'Rejected' },
    CANCELLED: { bg: 'rgba(100,100,100,0.1)', color: 'var(--text-secondary)', label: 'Cancelled' },
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Leave Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Apply and track leave requests</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isAdmin && (
            <button onClick={handleInitialize} disabled={initLoading} style={{
              padding: '9px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
            }}
            title="Initialize leave balances for all active employees">
              {initLoading ? '...' : '⚙ Initialize Balances'}
            </button>
          )}
          <button onClick={() => { setError(''); setShowModal(true); }} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 16px', background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px',
            fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-glow)',
          }}>
            + Apply Leave
          </button>
        </div>
      </div>

      {leaveTypes.length === 0 && (
        <div style={{ padding: '14px 16px', background: 'var(--warning-bg)', border: '1px solid rgba(255,159,10,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--warning)', marginBottom: '20px' }}>
          ⚠ No leave types configured.
          {isAdmin
            ? <> Go to <a href="/settings" style={{ color: 'var(--accent)', marginLeft: '4px' }}>Settings → Leave Types</a> to add them.</>
            : ' Contact HR to set up leave types.'}
        </div>
      )}

      {balances.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {balances.map((b: any) => {
            const pct = b.allocated > 0 ? (b.remaining / b.allocated) * 100 : 0;
            const color = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--danger)';
            return (
              <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {b.leaveType?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '26px', fontWeight: '700', color, lineHeight: 1 }}>{b.remaining}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>/ {b.allocated}d</span>
                </div>
                <div style={{ height: '3px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.4s' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{b.used} used</div>
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px', width: 'fit-content' }}>
          {[{ id: 'my', label: 'My Requests' }, { id: 'all', label: `All Requests` }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
              padding: '6px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? '500' : '400',
            }}>{tab.label}</button>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '8px' }} />)}
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌴</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>No leave requests</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {leaveTypes.length === 0 ? 'Add leave types in Settings first' : 'Click "Apply Leave" to submit a request'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  ...(isAdmin && activeTab === 'all' ? ['Employee'] : []),
                  'Leave Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Applied',
                  ...(isAdmin && activeTab === 'all' ? ['Action'] : []),
                ].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((req: any) => (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  {isAdmin && activeTab === 'all' && (
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {req.employee?.firstName} {req.employee?.lastName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {req.employee?.department?.name || 'No dept'}
                      </div>
                    </td>
                  )}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {req.leaveType?.name}
                    </span>
                    {req.leaveType?.isPaid === false && (
                      <span style={{ fontSize: '10px', color: 'var(--warning)', marginLeft: '6px', background: 'var(--warning-bg)', padding: '1px 5px', borderRadius: '4px' }}>Unpaid</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(req.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(req.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {req.totalDays}d
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.reason || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500', background: statusStyle[req.status]?.bg, color: statusStyle[req.status]?.color }}>
                      {statusStyle[req.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  {isAdmin && activeTab === 'all' && (
                    <td style={{ padding: '12px 16px' }}>
                      {req.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setShowApproveModal(req)} style={{ padding: '5px 10px', background: 'var(--success-bg)', border: '1px solid rgba(50,215,75,0.2)', borderRadius: '6px', color: 'var(--success)', fontSize: '12px', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap' }}>
                            ✓ Approve
                          </button>
                          <button onClick={() => handleAction(req.id, 'REJECTED')} disabled={actionLoading === req.id} style={{ padding: '5px 10px', background: 'var(--danger-bg)', border: '1px solid rgba(255,69,58,0.2)', borderRadius: '6px', color: 'var(--danger)', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                            ✗
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Apply for Leave</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Request will be sent to HR for approval</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>×</button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid rgba(255,69,58,0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {leaveTypes.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No leave types available.
                {isAdmin && <><br/><a href="/settings" style={{ color: 'var(--accent)' }}>Add leave types in Settings →</a></>}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Leave Type <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select value={form.leaveTypeId} onChange={e => setForm({ ...form, leaveTypeId: e.target.value })} required
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                    <option value="" style={{ background: '#111' }}>Select leave type</option>
                    {leaveTypes.map(t => (
                      <option key={t.id} value={t.id} style={{ background: '#111' }}>
                        {t.name} · {t.daysAllowed} days/year {t.isPaid ? '' : '(Unpaid)'}
                      </option>
                    ))}
                  </select>

                  {selectedBalance && (
                    <div style={{ marginTop: '8px', padding: '10px 12px', background: hasEnoughBalance ? 'var(--success-bg)' : 'var(--danger-bg)', border: `1px solid ${hasEnoughBalance ? 'rgba(50,215,75,0.15)' : 'rgba(255,69,58,0.15)'}`, borderRadius: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: hasEnoughBalance ? 'var(--success)' : 'var(--danger)', fontWeight: '500' }}>
                        {hasEnoughBalance ? '✓' : '⚠'} {selectedBalance.remaining} of {selectedBalance.allocated} days remaining
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{selectedBalance.used} used this year</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Start Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <DatePicker value={form.startDate} onChange={v => setForm({ ...form, startDate: v })} placeholder="Select date" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>End Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <DatePicker value={form.endDate} onChange={v => setForm({ ...form, endDate: v })} placeholder="Select date" minDate={form.startDate} />
                  </div>
                </div>

                {requestedDays > 0 && (
                  <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Duration</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: hasEnoughBalance ? 'var(--success)' : 'var(--danger)' }}>
                        {requestedDays} day{requestedDays > 1 ? 's' : ''}
                      </span>
                      {!hasEnoughBalance && selectedBalance && (
                        <span style={{ fontSize: '11px', color: 'var(--danger)', background: 'var(--danger-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                          -{requestedDays - selectedBalance.remaining}d over
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Reason</label>
                  <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={3}
                    placeholder="Brief reason for leave (optional)..."
                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>

                {!hasEnoughBalance && selectedBalance && (
                  <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'var(--warning-bg)', border: '1px solid rgba(255,159,10,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--warning)', lineHeight: 1.5 }}>
                    ⚠ You have {selectedBalance.remaining} days remaining but requesting {requestedDays} days. HR can still approve with special consideration.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !form.leaveTypeId || !form.startDate || !form.endDate} style={{
                    flex: 2, padding: '11px', background: 'var(--accent)', border: 'none',
                    borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px',
                    fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: (!form.leaveTypeId || !form.startDate || !form.endDate) ? 0.5 : 1,
                  }}>
                    {saving ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showApproveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '100%', maxWidth: '420px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Approve Leave Request</h2>

            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {showApproveModal.employee?.firstName} {showApproveModal.employee?.lastName}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                {showApproveModal.leaveType?.name} · {showApproveModal.totalDays} days
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                {new Date(showApproveModal.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — {new Date(showApproveModal.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              {showApproveModal.reason && (
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '6px', fontStyle: 'italic' }}>"{showApproveModal.reason}"</div>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: '16px' }}
              onClick={() => setOverrideBalance(!overrideBalance)}>
              <div style={{ width: '18px', height: '18px', border: `2px solid ${overrideBalance ? 'var(--accent)' : 'var(--border-strong)'}`, borderRadius: '4px', background: overrideBalance ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.15s' }}>
                {overrideBalance && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>Special consideration (HR Override)</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>Approve without deducting from leave balance. Use for exceptional cases.</div>
              </div>
            </label>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowApproveModal(null); setOverrideBalance(false); }} style={{ flex: 1, padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleAction(showApproveModal.id, 'APPROVED', overrideBalance)} disabled={actionLoading === showApproveModal.id} style={{ flex: 2, padding: '10px', background: 'var(--success)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                {actionLoading === showApproveModal.id ? 'Approving...' : overrideBalance ? '✓ Approve (No Deduction)' : '✓ Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
