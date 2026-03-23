'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const tabs = ['My Info', 'Attendance', 'Leave', 'Payslips', 'Performance'];

export default function MyProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('My Info');
  const [attendance, setAttendance] = useState<any>({ attendances: [], today: null });
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [leaveForm, setLeaveForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    api.get('/auth/me').then(res => setProfile(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'Attendance') {
      api.get('/attendance/my').then(res => setAttendance(res.data.data)).catch(() => {});
    }
    if (activeTab === 'Leave') {
      Promise.all([
        api.get('/leaves/my'),
        api.get('/leaves/balances'),
        api.get('/leaves/types'),
      ]).then(([r, b, t]) => {
        setLeaves(r.data.data);
        setBalances(b.data.data);
        setLeaveTypes(t.data.data);
      }).catch(() => {});
    }
    if (activeTab === 'Payslips') {
      api.get('/payroll/my').then(res => setPayslips(res.data.data)).catch(() => {});
    }
    if (activeTab === 'Performance') {
      api.get('/performance/my').then(res => setReviews(res.data.data)).catch(() => {});
    }
  }, [activeTab]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-in');
      const res = await api.get('/attendance/my');
      setAttendance(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-out');
      const res = await api.get('/attendance/my');
      setAttendance(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setCheckingIn(false); }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/leaves', leaveForm);
      setShowLeaveModal(false);
      setLeaveForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
      const res = await api.get('/leaves/my');
      setLeaves(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>Loading...</div>;

  const emp = profile?.employee;
  const inputStyle = { width: '100%', padding: '10px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' };

  return (
    <div style={{ padding: '32px', maxWidth: '900px' }}>
      {/* Profile Header */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: '700', color: 'white',
          }}>
            {emp ? `${emp.firstName?.[0]}${emp.lastName?.[0]}` : profile?.email?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {emp ? `${emp.firstName} ${emp.lastName}` : profile?.email}
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {emp?.designation || 'No designation'} {emp?.department && `· ${emp.department}`}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {emp && <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>ACTIVE</span>}
              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: 'rgba(91,79,245,0.1)', color: 'var(--accent)' }}>{profile?.role?.replace('_', ' ')}</span>
              {emp && <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>ID: {emp.employeeId}</span>}
            </div>
          </div>
          {/* Today attendance quick action */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Employee ID', value: emp?.employeeId || '—' },
            { label: 'Department', value: emp?.department || profile?.company?.name || '—' },
            { label: 'Basic Salary', value: emp ? `৳${Number(emp.basicSalary || 0).toLocaleString()}` : '—' },
            { label: 'Joined', value: emp ? new Date(emp.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 16px', borderRadius: '7px', border: 'none', fontSize: '13px', cursor: 'pointer',
            background: activeTab === tab ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === tab ? '500' : '400',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* My Info Tab */}
      {activeTab === 'My Info' && profile && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {[
            { title: 'Contact Information', fields: [
              { label: 'Email', value: profile.email },
              { label: 'Phone', value: emp?.phone || '—' },
              { label: 'Address', value: emp?.address || '—' },
              { label: 'City', value: emp?.city || '—' },
            ]},
            { title: 'Personal Details', fields: [
              { label: 'Date of Birth', value: emp?.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString() : '—' },
              { label: 'Gender', value: emp?.gender || '—' },
              { label: 'Blood Group', value: emp?.bloodGroup || '—' },
              { label: 'National ID', value: emp?.nationalId || '—' },
            ]},
            { title: 'Bank Information', fields: [
              { label: 'Bank Name', value: emp?.bankName || '—' },
              { label: 'Account Number', value: emp?.bankAccount || '—' },
              { label: 'Branch', value: emp?.bankBranch || '—' },
            ]},
          ].map(section => (
            <div key={section.title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>{section.title}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {section.fields.map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{f.label}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'Attendance' && (
        <div>
          {/* Today Card */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              {!attendance.today?.checkIn ? (
                <button onClick={handleCheckIn} disabled={checkingIn} style={{ padding: '9px 18px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {checkingIn ? '...' : '✓ Check In'}
                </button>
              ) : !attendance.today?.checkOut ? (
                <button onClick={handleCheckOut} disabled={checkingIn} style={{ padding: '9px 18px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {checkingIn ? '...' : '✗ Check Out'}
                </button>
              ) : (
                <span style={{ fontSize: '13px', color: '#22C55E' }}>✓ Complete</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '32px' }}>
              {[
                { label: 'Check In', value: attendance.today?.checkIn ? new Date(attendance.today.checkIn).toLocaleTimeString() : '—', color: '#22C55E' },
                { label: 'Check Out', value: attendance.today?.checkOut ? new Date(attendance.today.checkOut).toLocaleTimeString() : '—', color: '#EF4444' },
                { label: 'Work Hours', value: attendance.today?.workHours ? `${attendance.today.workHours}h` : '—', color: 'var(--accent)' },
                { label: 'Status', value: attendance.today?.status || 'Not marked', color: 'var(--text-secondary)' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* This month */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>This Month</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date', 'Check In', 'Check Out', 'Hours', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendance.attendances?.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No attendance records this month</td></tr>
                ) : attendance.attendances?.map((a: any) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(a.date).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: '#22C55E' }}>{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: '#EF4444' }}>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{a.workHours ? `${a.workHours}h` : '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500',
                        background: a.status === 'PRESENT' ? 'rgba(34,197,94,0.1)' : a.status === 'LATE' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        color: a.status === 'PRESENT' ? '#22C55E' : a.status === 'LATE' ? '#F59E0B' : '#EF4444',
                      }}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Tab */}
      {activeTab === 'Leave' && (
        <div>
          {/* Balances */}
          {balances.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {balances.map((b: any) => (
                <div key={b.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{b.leaveType?.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent)' }}>{b.remaining}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {b.allocated} days</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Used: {b.used} days</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Leave Requests</h3>
            <button onClick={() => setShowLeaveModal(true)} style={{ padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              + Apply Leave
            </button>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            {leaves.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No leave requests yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Type', 'From', 'To', 'Days', 'Status', 'Applied'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l: any) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{l.leaveType?.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(l.startDate).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(l.endDate).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{l.totalDays}d</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500',
                          background: l.status === 'APPROVED' ? 'rgba(34,197,94,0.1)' : l.status === 'PENDING' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                          color: l.status === 'APPROVED' ? '#22C55E' : l.status === 'PENDING' ? '#F59E0B' : '#EF4444',
                        }}>{l.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Payslips Tab */}
      {activeTab === 'Payslips' && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {payslips.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No payslips yet</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Period', 'Basic', 'Gross', 'Deductions', 'Net Salary', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payslips.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {new Date(2024, p.month - 1).toLocaleString('default', { month: 'long' })} {p.year}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>৳{Number(p.basicSalary).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>৳{Number(p.grossSalary).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#EF4444' }}>৳{Number(p.totalDeduction).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '700', color: '#22C55E' }}>৳{Number(p.netSalary).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500',
                        background: p.status === 'PAID' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: p.status === 'PAID' ? '#22C55E' : '#F59E0B',
                      }}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'Performance' && (
        <div>
          {reviews.length === 0 ? (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No performance reviews yet</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {reviews.map((r: any) => (
                <div key={r.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{r.period} {r.year}</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: r.rating >= 4 ? '#22C55E' : '#F59E0B' }}>{r.rating}<span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/5</span></div>
                  </div>
                  {r.comments && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{r.comments}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Apply for Leave</h2>
              <button onClick={() => setShowLeaveModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <form onSubmit={handleLeaveSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Leave Type *</label>
                <select value={leaveForm.leaveTypeId} onChange={e => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })} required style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ background: '#1A1A1A' }}>Select</option>
                  {leaveTypes.map(t => <option key={t.id} value={t.id} style={{ background: '#1A1A1A' }}>{t.name} ({t.daysAllowed}d)</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Start Date *</label>
                  <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>End Date *</label>
                  <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Reason</label>
                <textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows={3} placeholder="Reason..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowLeaveModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
