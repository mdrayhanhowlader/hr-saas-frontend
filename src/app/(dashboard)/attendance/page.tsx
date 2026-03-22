'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

type TabType = 'overview' | 'manual' | 'biometric';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [attendances, setAttendances] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [myAttendance, setMyAttendance] = useState<any>({ attendances: [], today: null });
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  // Manual update state
  const [employees, setEmployees] = useState<any[]>([]);
  const [manualForm, setManualForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '', status: 'PRESENT', note: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [savingManual, setSavingManual] = useState(false);

  // Biometric state
  const [devices, setDevices] = useState<any[]>([]);
  const [deviceForm, setDeviceForm] = useState({ name: '', deviceId: '', type: 'FINGERPRINT', location: '', ipAddress: '' });
  const [savingDevice, setSavingDevice] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  const fetchData = async () => {
    try {
      const [attRes, statsRes, myRes] = await Promise.all([
        isAdmin ? api.get('/attendance') : Promise.resolve({ data: { data: [] } }),
        isAdmin ? api.get('/attendance/stats') : Promise.resolve({ data: { data: null } }),
        api.get('/attendance/my'),
      ]);
      setAttendances(attRes.data.data || []);
      setStats(statsRes.data.data);
      setMyAttendance(myRes.data.data || { attendances: [], today: null });
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    if (isAdmin) {
      api.get('/employees?limit=100').then(res => setEmployees(res.data.data || [])).catch(() => {});
      api.get('/biometric-devices').then(res => setDevices(res.data.data || [])).catch(() => {});
    }
  }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-in');
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      await api.post('/attendance/check-out');
      fetchData();
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setCheckingIn(false); }
  };

  // Manual create attendance by HR
  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingManual(true);
    try {
      const { employeeId, date, checkIn, checkOut, status, note } = manualForm;
      const checkInDT = checkIn ? new Date(`${date}T${checkIn}:00`) : null;
      const checkOutDT = checkOut ? new Date(`${date}T${checkOut}:00`) : null;
      let workHours = null;
      if (checkInDT && checkOutDT) {
        workHours = ((checkOutDT.getTime() - checkInDT.getTime()) / (1000 * 60 * 60)).toFixed(2);
      }

      // Check if record exists
      const existing = attendances.find(a =>
        a.employeeId === employeeId &&
        new Date(a.date).toDateString() === new Date(date).toDateString()
      );

      if (existing) {
        await api.put(`/attendance/${existing.id}`, { checkIn: checkInDT, checkOut: checkOutDT, status, note });
      } else {
        // Use biometric punch endpoint for manual HR entry
        await api.post('/attendance/manual', { employeeId, date, checkIn: checkInDT, checkOut: checkOutDT, status, note, source: 'MANUAL' });
      }
      fetchData();
      setManualForm({ employeeId: '', date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '', status: 'PRESENT', note: '' });
      alert('Attendance saved successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save attendance');
    } finally { setSavingManual(false); }
  };

  // Inline edit existing record
  const handleInlineUpdate = async (id: string) => {
    try {
      await api.put(`/attendance/${id}`, editForm);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  // Add biometric device
  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDevice(true);
    try {
      await api.post('/biometric-devices', deviceForm);
      const res = await api.get('/biometric-devices');
      setDevices(res.data.data || []);
      setShowDeviceModal(false);
      setDeviceForm({ name: '', deviceId: '', type: 'FINGERPRINT', location: '', ipAddress: '' });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add device');
    } finally { setSavingDevice(false); }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('Remove this device?')) return;
    try {
      await api.delete(`/biometric-devices/${id}`);
      setDevices(devices.filter(d => d.id !== id));
    } catch {}
  };

  const statusColors: any = {
    PRESENT: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
    LATE: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
    ABSENT: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
    ON_LEAVE: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
    HALF_DAY: { bg: 'rgba(168,85,247,0.1)', color: '#A855F7' },
    HOLIDAY: { bg: 'rgba(100,100,100,0.1)', color: '#888' },
    WEEKEND: { bg: 'rgba(100,100,100,0.1)', color: '#666' },
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    borderRadius: '7px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
  };

  const tabs = isAdmin
    ? [{ id: 'overview', label: 'Overview' }, { id: 'manual', label: 'Manual Entry' }, { id: 'biometric', label: 'Biometric Devices' }]
    : [{ id: 'overview', label: 'My Attendance' }];

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)' }}>Attendance</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {/* Check in/out button */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {myAttendance.today?.checkIn && (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: '8px' }}>
              In: <span style={{ color: '#22C55E', fontWeight: '600' }}>{new Date(myAttendance.today.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {myAttendance.today?.checkOut && (
                <> · Out: <span style={{ color: '#EF4444', fontWeight: '600' }}>{new Date(myAttendance.today.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></>
              )}
            </div>
          )}
          {!myAttendance.today?.checkIn ? (
            <button onClick={handleCheckIn} disabled={checkingIn} style={{ padding: '10px 20px', background: '#22C55E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 0 15px rgba(34,197,94,0.3)' }}>
              {checkingIn ? '...' : '✓ Check In'}
            </button>
          ) : !myAttendance.today?.checkOut ? (
            <button onClick={handleCheckOut} disabled={checkingIn} style={{ padding: '10px 20px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 0 15px rgba(239,68,68,0.3)' }}>
              {checkingIn ? '...' : '✗ Check Out'}
            </button>
          ) : (
            <div style={{ padding: '10px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', fontSize: '13px', color: '#22C55E', fontWeight: '500' }}>
              ✓ {myAttendance.today?.workHours}h worked today
            </div>
          )}
        </div>
      </div>

      {/* Stats — admin only */}
      {isAdmin && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Employees', value: stats.totalEmployees, color: 'var(--accent)' },
            { label: 'Present', value: stats.presentToday, color: '#22C55E' },
            { label: 'Late', value: stats.lateToday, color: '#F59E0B' },
            { label: 'Absent', value: stats.absentToday, color: '#EF4444' },
            { label: 'Not Marked', value: stats.notMarked, color: 'var(--text-muted)' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} style={{
              padding: '8px 20px', borderRadius: '7px', border: 'none', fontSize: '13px', cursor: 'pointer',
              background: activeTab === tab.id ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? '500' : '400', transition: 'all 0.15s',
            }}>{tab.label}</button>
          ))}
        </div>
      )}

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div>
          {/* My today card */}
          {myAttendance.today && (
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Today's Summary</h3>
              <div style={{ display: 'flex', gap: '40px' }}>
                {[
                  { label: 'Check In', value: myAttendance.today?.checkIn ? new Date(myAttendance.today.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—', color: '#22C55E' },
                  { label: 'Check Out', value: myAttendance.today?.checkOut ? new Date(myAttendance.today.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—', color: '#EF4444' },
                  { label: 'Work Hours', value: myAttendance.today?.workHours ? `${myAttendance.today.workHours}h` : '—', color: 'var(--accent)' },
                  { label: 'Status', value: myAttendance.today?.status || '—', color: statusColors[myAttendance.today?.status]?.color || 'var(--text-secondary)' },
                  { label: 'Source', value: myAttendance.today?.source || '—', color: 'var(--text-secondary)' },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance table */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {isAdmin ? 'All Attendance — This Month' : 'My Attendance — This Month'}
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {(isAdmin ? ['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Source', ''] : ['Date', 'Check In', 'Check Out', 'Hours', 'Status']).map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : (isAdmin ? attendances : myAttendance.attendances).length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No records found</td></tr>
                ) : (isAdmin ? attendances : myAttendance.attendances).map((att: any) => (
                  <tr key={att.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = editingId === att.id ? 'var(--bg-hover)' : 'transparent')}
                  >
                    {isAdmin && (
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{att.employee?.firstName} {att.employee?.lastName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{att.employee?.employeeId}</div>
                      </td>
                    )}
                    <td style={{ padding: '11px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(att.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </td>
                    {editingId === att.id ? (
                      <>
                        <td style={{ padding: '8px 16px' }}>
                          <input type="time" value={editForm.checkInTime || ''} onChange={e => setEditForm({ ...editForm, checkInTime: e.target.value })}
                            style={{ ...inputStyle, width: '110px', colorScheme: 'dark' }} />
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <input type="time" value={editForm.checkOutTime || ''} onChange={e => setEditForm({ ...editForm, checkOutTime: e.target.value })}
                            style={{ ...inputStyle, width: '110px', colorScheme: 'dark' }} />
                        </td>
                        <td style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>—</td>
                        <td style={{ padding: '8px 16px' }}>
                          <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                            style={{ ...inputStyle, width: '120px', cursor: 'pointer' }}>
                            {['PRESENT','LATE','ABSENT','HALF_DAY','ON_LEAVE','HOLIDAY','WEEKEND'].map(s => (
                              <option key={s} value={s} style={{ background: '#1A1A1A' }}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--text-muted)' }}>{att.source}</td>
                        <td style={{ padding: '8px 16px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => {
                              const date = new Date(att.date).toISOString().split('T')[0];
                              const checkIn = editForm.checkInTime ? new Date(`${date}T${editForm.checkInTime}:00`) : att.checkIn;
                              const checkOut = editForm.checkOutTime ? new Date(`${date}T${editForm.checkOutTime}:00`) : att.checkOut;
                              handleInlineUpdate(att.id);
                              api.put(`/attendance/${att.id}`, { checkIn, checkOut, status: editForm.status }).then(() => { setEditingId(null); fetchData(); }).catch(() => {});
                            }} style={{ padding: '5px 10px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: 'white', fontSize: '12px', cursor: 'pointer' }}>Save</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '11px 16px', fontSize: '13px', color: '#22C55E' }}>
                          {att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '13px', color: '#EF4444' }}>
                          {att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '11px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {att.workHours ? `${att.workHours}h` : '—'}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', background: statusColors[att.status]?.bg, color: statusColors[att.status]?.color }}>
                            {att.status}
                          </span>
                        </td>
                        {isAdmin && (
                          <>
                            <td style={{ padding: '11px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{att.source}</td>
                            <td style={{ padding: '11px 16px' }}>
                              <button onClick={() => {
                                setEditingId(att.id);
                                const checkInTime = att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
                                const checkOutTime = att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
                                setEditForm({ status: att.status, checkInTime, checkOutTime });
                              }} style={{ padding: '5px 10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}>
                                ✏️ Edit
                              </button>
                            </td>
                          </>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MANUAL ENTRY TAB ── */}
      {activeTab === 'manual' && isAdmin && (
        <div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>Manual Attendance Entry</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>HR can manually create or update attendance for any employee</p>

            <form onSubmit={handleManualCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Employee *</label>
                  <select value={manualForm.employeeId} onChange={e => setManualForm({ ...manualForm, employeeId: e.target.value })} required
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={{ background: '#1A1A1A' }}>Select employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id} style={{ background: '#1A1A1A' }}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Date *</label>
                  <input type="date" value={manualForm.date} onChange={e => setManualForm({ ...manualForm, date: e.target.value })} required
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Status *</label>
                  <select value={manualForm.status} onChange={e => setManualForm({ ...manualForm, status: e.target.value })}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND'].map(s => (
                      <option key={s} value={s} style={{ background: '#1A1A1A' }}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Check In Time</label>
                  <input type="time" value={manualForm.checkIn} onChange={e => setManualForm({ ...manualForm, checkIn: e.target.value })}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Check Out Time</label>
                  <input type="time" value={manualForm.checkOut} onChange={e => setManualForm({ ...manualForm, checkOut: e.target.value })}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Note</label>
                  <input type="text" value={manualForm.note} onChange={e => setManualForm({ ...manualForm, note: e.target.value })}
                    placeholder="Optional note..."
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
              <button type="submit" disabled={savingManual} style={{
                padding: '10px 24px', background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                cursor: savingManual ? 'not-allowed' : 'pointer',
              }}>
                {savingManual ? 'Saving...' : '💾 Save Attendance'}
              </button>
            </form>
          </div>

          {/* Info box */}
          <div style={{ background: 'rgba(91,79,245,0.08)', border: '1px solid rgba(91,79,245,0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--accent)', marginBottom: '8px' }}>💡 How manual entry works</div>
            <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '16px' }}>
              <li>If attendance already exists for that date → it will be <strong style={{ color: 'var(--text-primary)' }}>updated</strong></li>
              <li>If no record exists → a new record will be <strong style={{ color: 'var(--text-primary)' }}>created</strong></li>
              <li>You can also click <strong style={{ color: 'var(--text-primary)' }}>✏️ Edit</strong> on any row in Overview to update inline</li>
              <li>Source will be marked as <strong style={{ color: 'var(--text-primary)' }}>MANUAL</strong></li>
            </ul>
          </div>
        </div>
      )}

      {/* ── BIOMETRIC DEVICES TAB ── */}
      {activeTab === 'biometric' && isAdmin && (
        <div>
          {/* API endpoint info */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Biometric Device Setup</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Connect fingerprint or face recognition devices</p>
              </div>
              <button onClick={() => setShowDeviceModal(true)} style={{
                padding: '9px 16px', background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}>
                + Register Device
              </button>
            </div>

            {/* API endpoint card */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📡 Device API Endpoint
              </div>
              <div style={{ background: '#0A0A0A', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '12px', color: '#22C55E', marginBottom: '12px' }}>
                POST http://YOUR_SERVER_IP:5000/api/attendance/biometric-punch
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Request body (JSON):</div>
              <div style={{ background: '#0A0A0A', borderRadius: '8px', padding: '14px', fontFamily: 'monospace', fontSize: '12px', color: '#A78BFA' }}>
                {`{
  "deviceId": "YOUR_DEVICE_ID",
  "biometricId": "EMPLOYEE_BIOMETRIC_ID",
  "punchTime": "2025-03-21T09:00:00",
  "punchType": "IN"  // or "OUT"
}`}
              </div>
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#22C55E' }}>✓ ZKTeco</strong> · <strong style={{ color: '#22C55E' }}>✓ Hikvision</strong> · <strong style={{ color: '#22C55E' }}>✓ Anviz</strong> · <strong style={{ color: '#22C55E' }}>✓ Suprema</strong> · Any device with HTTP push support
              </div>
            </div>
          </div>

          {/* Setup steps */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>How to connect your device</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { step: '1', title: 'Register Device', desc: 'Add device with unique ID using "Register Device" button', color: 'var(--accent)' },
                { step: '2', title: 'Set Biometric ID', desc: 'Go to Employee profile → set Biometric ID to match device user ID', color: '#3B82F6' },
                { step: '3', title: 'Configure Device', desc: 'In device settings, set HTTP push URL to your server API endpoint', color: '#22C55E' },
                { step: '4', title: 'Test Connection', desc: 'Employee punches device → attendance auto-records in system', color: '#F59E0B' },
              ].map(s => (
                <div key={s.step} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white', marginBottom: '10px' }}>{s.step}</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>{s.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Registered devices */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Registered Devices ({devices.length})</h3>
            </div>
            {devices.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🖥️</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>No devices registered</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Register your fingerprint or face recognition device to get started</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Device Name', 'Device ID', 'Type', 'Location', 'IP Address', 'Last Sync', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {devices.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{d.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{d.deviceId}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', background: 'rgba(91,79,245,0.1)', color: 'var(--accent)' }}>
                          {d.type === 'FINGERPRINT' ? '🖐️' : d.type === 'FACE' ? '😊' : '💳'} {d.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{d.location || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{d.ipAddress || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {d.lastSync ? new Date(d.lastSync).toLocaleString() : 'Never'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', background: d.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: d.isActive ? '#22C55E' : '#EF4444' }}>
                          {d.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => handleDeleteDevice(d.id)} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', color: '#EF4444', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add Device Modal */}
          {showDeviceModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Register Biometric Device</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Add fingerprint, face, or card device</p>
                  </div>
                  <button onClick={() => setShowDeviceModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>
                <form onSubmit={handleAddDevice}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { label: 'Device Name *', key: 'name', placeholder: 'Main Entrance Device', required: true, full: true },
                      { label: 'Device ID *', key: 'deviceId', placeholder: 'e.g. ZK-001', required: true },
                      { label: 'IP Address', key: 'ipAddress', placeholder: '192.168.1.100' },
                      { label: 'Location', key: 'location', placeholder: 'Main Entrance' },
                    ].map(f => (
                      <div key={f.key} style={f.full ? { gridColumn: 'span 2' } : {}}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>{f.label}</label>
                        <input value={(deviceForm as any)[f.key]} onChange={e => setDeviceForm({ ...deviceForm, [f.key]: e.target.value })}
                          required={f.required} placeholder={f.placeholder} style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                          onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                    ))}
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>Device Type</label>
                      <select value={deviceForm.type} onChange={e => setDeviceForm({ ...deviceForm, type: e.target.value })}
                        style={{ ...inputStyle, cursor: 'pointer' }}>
                        {[
                          { value: 'FINGERPRINT', label: '🖐️ Fingerprint' },
                          { value: 'FACE', label: '😊 Face Recognition' },
                          { value: 'CARD', label: '💳 Card/RFID' },
                          { value: 'PIN', label: '🔢 PIN' },
                        ].map(t => <option key={t.value} value={t.value} style={{ background: '#1A1A1A' }}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setShowDeviceModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" disabled={savingDevice} style={{ flex: 1, padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: savingDevice ? 'not-allowed' : 'pointer' }}>
                      {savingDevice ? 'Registering...' : 'Register Device'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
