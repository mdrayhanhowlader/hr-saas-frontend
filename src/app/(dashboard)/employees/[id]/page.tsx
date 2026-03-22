'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';
import PhotoUpload from '@/components/ui/PhotoUpload';
import SalaryAdjustModal from '@/components/salary/SalaryAdjustModal';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '👤' },
  { id: 'personal', label: 'Personal', icon: '📋' },
  { id: 'employment', label: 'Employment', icon: '💼' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'salary', label: 'Salary', icon: '💰' },
  { id: 'leaves', label: 'Leave', icon: '🌴' },
  { id: 'attendance', label: 'Attendance', icon: '📅' },
  { id: 'performance', label: 'Performance', icon: '📈' },
];

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const DEPARTMENTS = ['Engineering','Product','Design','Marketing','Sales','Finance','HR','Operations','Legal','Customer Support'];

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const fetchEmployee = useCallback(async () => {
    try {
      const res = await api.get(`/employees/${id}`);
      const emp = res.data.data;
      setEmployee(emp);
      setForm({
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        email: emp.email || '',
        phone: emp.phone || '',
        photo: emp.photo || '',
        dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split('T')[0] : '',
        gender: emp.gender || '',
        bloodGroup: emp.bloodGroup || '',
        nationalId: emp.nationalId || '',
        address: emp.address || '',
        city: emp.city || '',
        country: emp.country || 'Bangladesh',
        departmentName: emp.department?.name || '',
        designation: emp.designation || '',
        employmentType: emp.employmentType || 'FULL_TIME',
        employmentStatus: emp.employmentStatus || 'ACTIVE',
        basicSalary: emp.basicSalary || '',
        joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
        confirmationDate: emp.confirmationDate ? emp.confirmationDate.split('T')[0] : '',
        biometricId: emp.biometricId || '',
        bankName: emp.bankName || '',
        bankAccount: emp.bankAccount || '',
        bankBranch: emp.bankBranch || '',
      });
    } catch { router.push('/employees'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchEmployee(); }, [fetchEmployee]);

  useEffect(() => {
    if (tab === 'salary' && employee) {
      api.get(`/salary/${id}/history`).then(r => setSalaryHistory(r.data.data || [])).catch(() => {});
    }
    if (tab === 'leaves' && employee) {
      api.get(`/leaves?employeeId=${id}&limit=20`).then(r => setLeaves(r.data.data || [])).catch(() => {});
    }
    if (tab === 'attendance' && employee) {
      api.get(`/attendance?employeeId=${id}&limit=30`).then(r => setAttendances(r.data.data || [])).catch(() => {});
    }
    if (tab === 'performance' && employee) {
      api.get(`/performance?employeeId=${id}`).then(r => setReviews(r.data.data || [])).catch(() => {});
    }
  }, [tab, employee, id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put(`/employees/${id}`, form);
      setSuccess('Changes saved successfully');
      setEditing(false);
      fetchEmployee();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDocUpload = async (fieldKey: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      const url = data.data.url;
      await api.post('/employees/' + id + '/documents', { name: fieldKey, type: fieldKey.toUpperCase(), url });
      fetchEmployee();
    } catch { alert('Upload failed'); }
  };

  const setF = (key: string, val: string) => setForm((f: any) => ({ ...f, [key]: val }));

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: editing ? 'var(--bg-input)' : 'var(--bg-elevated)',
    border: `1px solid ${editing ? 'var(--border)' : 'transparent'}`,
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none',
    transition: 'all 0.15s',
    cursor: editing ? 'text' : 'default',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: '600',
    color: 'var(--text-tertiary)', marginBottom: '5px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  const Field = ({ label, fieldKey, type = 'text', options, readOnly }: any) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {options ? (
        <select value={form[fieldKey] || ''} onChange={e => setF(fieldKey, e.target.value)} disabled={!editing || readOnly}
          style={{ ...inputStyle, cursor: editing && !readOnly ? 'pointer' : 'default' }}>
          <option value="" style={{ background: 'var(--bg-card)' }}>—</option>
          {options.map((o: any) => <option key={o.value || o} value={o.value || o} style={{ background: 'var(--bg-card)' }}>{o.label || o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[fieldKey] || ''} onChange={e => setF(fieldKey, e.target.value)}
          disabled={!editing || readOnly} style={inputStyle}
          onFocus={e => editing && (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = editing ? 'var(--border)' : 'transparent')} />
      )}
    </div>
  );

  if (loading) return (
    <div style={{ padding: '28px 32px' }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', marginBottom: '12px', borderRadius: 'var(--radius-md)' }} />)}
    </div>
  );

  if (!employee) return null;

  const statusColors: any = {
    ACTIVE: { bg: 'var(--success-bg)', color: 'var(--success)' },
    ON_LEAVE: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    TERMINATED: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
    PROBATION: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  };
  const sc = statusColors[employee.employmentStatus] || statusColors.ACTIVE;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px' }}>
      {showSalaryModal && (
        <SalaryAdjustModal employee={employee} onClose={() => setShowSalaryModal(false)} onSuccess={() => { fetchEmployee(); setShowSalaryModal(false); }} />
      )}

      {/* Back */}
      <button onClick={() => router.push('/employees')} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', marginBottom: '20px', padding: 0 }}>
        ← Back to Employees
      </button>

      {/* Header */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          <div style={{ flexShrink: 0 }}>
            {editing ? (
              <PhotoUpload value={form.photo} onChange={v => setF('photo', v)} size={80} initials={`${employee.firstName?.[0]}${employee.lastName?.[0]}`} />
            ) : (
              employee.photo ? (
                <img src={employee.photo} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `hsl(${(employee.firstName?.charCodeAt(0) || 0) * 15 % 360}, 55%, 40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: 'white' }}>
                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                </div>
              )
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {employee.firstName} {employee.lastName}
                </h1>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {employee.designation || 'No designation'} {employee.department?.name ? `· ${employee.department.name}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '600', background: sc.bg, color: sc.color }}>
                    {employee.employmentStatus}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                    {employee.employeeId}
                  </span>
                  <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '11px', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                    {employee.user?.role?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {editing ? (
                  <>
                    <button onClick={() => { setEditing(false); setError(''); fetchEmployee(); }} style={{ padding: '8px 14px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      {saving ? 'Saving...' : '✓ Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setShowSalaryModal(true)} style={{ padding: '8px 14px', background: 'var(--success-bg)', border: '1px solid rgba(29,131,72,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                      💰 Adjust Salary
                    </button>
                    <button onClick={() => setEditing(true)} style={{ padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      ✏ Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>

            {error && <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px' }}>{error}</div>}
            {success && <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--success-bg)', border: '1px solid rgba(29,131,72,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', fontSize: '13px' }}>✓ {success}</div>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '7px 12px', borderRadius: '6px', border: 'none', fontSize: '12px',
            background: tab === t.id ? 'var(--bg-base)' : 'transparent',
            color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: tab === t.id ? '500' : '400', cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>

        {/* Overview */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { label: 'Email', value: employee.email },
              { label: 'Phone', value: employee.phone || '—' },
              { label: 'Department', value: employee.department?.name || '—' },
              { label: 'Designation', value: employee.designation || '—' },
              { label: 'Employment Type', value: employee.employmentType?.replace('_', ' ') || '—' },
              { label: 'Joining Date', value: employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
              { label: 'Basic Salary', value: `৳${Number(employee.basicSalary).toLocaleString()}` },
              { label: 'Biometric ID', value: employee.biometricId || '—' },
              { label: 'NID', value: employee.nationalId || '—' },
              { label: 'Bank', value: employee.bankName ? `${employee.bankName} · ${employee.bankAccount || ''}` : '—' },
            ].map(item => (
              <div key={item.label} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={labelStyle}>{item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Personal */}
        {tab === 'personal' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="First Name" fieldKey="firstName" />
            <Field label="Last Name" fieldKey="lastName" />
            <div>
              <label style={labelStyle}>Date of Birth</label>
              {editing ? (
                <DatePicker value={form.dateOfBirth} onChange={v => setF('dateOfBirth', v)} placeholder="Select DOB" maxDate={new Date().toISOString().split('T')[0]} />
              ) : (
                <div style={{ ...inputStyle, cursor: 'default' }}>{form.dateOfBirth ? new Date(form.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
              )}
            </div>
            <Field label="Gender" fieldKey="gender" options={['MALE','FEMALE','OTHER']} />
            <Field label="Blood Group" fieldKey="bloodGroup" options={BLOOD_GROUPS} />
            <Field label="National ID (NID)" fieldKey="nationalId" />
            <Field label="Phone" fieldKey="phone" />
            <Field label="City" fieldKey="city" />
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Address" fieldKey="address" />
            </div>
            <Field label="Country" fieldKey="country" />
          </div>
        )}

        {/* Employment */}
        {tab === 'employment' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Department" fieldKey="departmentName" options={DEPARTMENTS} />
            <div>
              <label style={labelStyle}>Designation</label>
              <input value={form.designation || ''} onChange={e => setF('designation', e.target.value)} disabled={!editing} style={inputStyle}
                onFocus={e => editing && (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = editing ? 'var(--border)' : 'transparent')} />
            </div>
            <Field label="Employment Type" fieldKey="employmentType" options={[
              { value: 'FULL_TIME', label: 'Full Time' },
              { value: 'PART_TIME', label: 'Part Time' },
              { value: 'CONTRACT', label: 'Contract' },
              { value: 'INTERN', label: 'Intern' },
            ]} />
            <Field label="Employment Status" fieldKey="employmentStatus" options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PROBATION', label: 'Probation' },
              { value: 'ON_LEAVE', label: 'On Leave' },
              { value: 'TERMINATED', label: 'Terminated' },
            ]} />
            <div>
              <label style={labelStyle}>Joining Date</label>
              {editing ? (
                <DatePicker value={form.joiningDate} onChange={v => setF('joiningDate', v)} placeholder="Select date" />
              ) : (
                <div style={{ ...inputStyle, cursor: 'default' }}>{form.joiningDate ? new Date(form.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Confirmation Date</label>
              {editing ? (
                <DatePicker value={form.confirmationDate} onChange={v => setF('confirmationDate', v)} placeholder="Select date" />
              ) : (
                <div style={{ ...inputStyle, cursor: 'default' }}>{form.confirmationDate ? new Date(form.confirmationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}</div>
              )}
            </div>
            <Field label="Biometric ID" fieldKey="biometricId" />
            <div />
            <div style={{ gridColumn: 'span 2', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Bank Information</div>
            </div>
            <Field label="Bank Name" fieldKey="bankName" />
            <Field label="Account Number" fieldKey="bankAccount" />
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Branch" fieldKey="bankBranch" />
            </div>
          </div>
        )}

        {/* Documents */}
        {tab === 'documents' && (
          <div>
            {employee.documents?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>No documents uploaded</div>
                <div style={{ fontSize: '13px' }}>Upload documents using the buttons below</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {employee.documents?.map((doc: any) => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '20px' }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{doc.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{doc.type}</div>
                    </div>
                    <a href={doc.url} target="_blank" rel="noreferrer" style={{ padding: '5px 12px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-glow)', borderRadius: '6px', color: 'var(--accent)', fontSize: '12px', textDecoration: 'none' }}>
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Upload New Document</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { label: 'NID Front', key: 'NID_FRONT' },
                  { label: 'NID Back', key: 'NID_BACK' },
                  { label: 'CV / Resume', key: 'CV' },
                  { label: 'Certificate', key: 'CERTIFICATE' },
                  { label: 'Offer Letter', key: 'OFFER_LETTER' },
                  { label: 'Other', key: 'OTHER' },
                ].map(doc => (
                  <label key={doc.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'var(--bg-input)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-input)'; }}
                  >
                    <svg width="14" height="14" fill="none" stroke="var(--text-tertiary)" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{doc.label}</span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleDocUpload(doc.key, f); e.target.value = ''; }} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Salary */}
        {tab === 'salary' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Basic Salary', value: `৳${Number(employee.basicSalary).toLocaleString()}`, color: 'var(--text-primary)' },
                { label: 'Est. Gross', value: `৳${Math.round(Number(employee.basicSalary) * 1.6).toLocaleString()}`, color: 'var(--success)', sub: 'Basic × 1.6' },
                { label: 'Est. Net', value: `৳${Math.round(Number(employee.basicSalary) * 1.6 * 0.87).toLocaleString()}`, color: 'var(--accent)', sub: 'After deductions' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
                  {s.sub && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{s.sub}</div>}
                </div>
              ))}
            </div>

            <button onClick={() => setShowSalaryModal(true)} style={{ marginBottom: '20px', padding: '10px 18px', background: 'var(--success)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              📈 Adjust Salary
            </button>

            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Salary History</div>
            {salaryHistory.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>No salary adjustments yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {salaryHistory.map((h: any) => {
                  const isIncrease = Number(h.newSalary) > Number(h.previousSalary);
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isIncrease ? 'var(--success-bg)' : 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                        {isIncrease ? '📈' : '📉'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          ৳{Number(h.previousSalary).toLocaleString()} → ৳{Number(h.newSalary).toLocaleString()}
                          <span style={{ marginLeft: '8px', fontSize: '12px', color: isIncrease ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                            {isIncrease ? '+' : ''}৳{(Number(h.newSalary) - Number(h.previousSalary)).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {h.reason || 'No reason'} · Effective: {new Date(h.effectiveDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        {new Date(h.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Leaves */}
        {tab === 'leaves' && (
          <div>
            {leaves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌴</div>No leave requests
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Type', 'From', 'To', 'Days', 'Status', 'Applied'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l: any) => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{l.leaveType?.name}</td>
                      <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(l.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                      <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(l.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                      <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{l.totalDays}d</td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500',
                          background: l.status === 'APPROVED' ? 'var(--success-bg)' : l.status === 'PENDING' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                          color: l.status === 'APPROVED' ? 'var(--success)' : l.status === 'PENDING' ? 'var(--warning)' : 'var(--danger)',
                        }}>{l.status}</span>
                      </td>
                      <td style={{ padding: '11px 12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>{new Date(l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Attendance */}
        {tab === 'attendance' && (
          <div>
            {attendances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>No attendance records
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Source'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((a: any) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                      <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--success)' }}>{a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td style={{ padding: '11px 12px', fontSize: '13px', color: 'var(--danger)' }}>{a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td style={{ padding: '11px 12px', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{a.workHours ? `${a.workHours}h` : '—'}</td>
                      <td style={{ padding: '11px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500',
                          background: a.status === 'PRESENT' ? 'var(--success-bg)' : a.status === 'LATE' ? 'var(--warning-bg)' : a.status === 'ABSENT' ? 'var(--danger-bg)' : 'var(--bg-elevated)',
                          color: a.status === 'PRESENT' ? 'var(--success)' : a.status === 'LATE' ? 'var(--warning)' : a.status === 'ABSENT' ? 'var(--danger)' : 'var(--text-secondary)',
                        }}>{a.status}</span>
                      </td>
                      <td style={{ padding: '11px 12px', fontSize: '11px', color: 'var(--text-tertiary)' }}>{a.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Performance */}
        {tab === 'performance' && (
          <div>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>No performance reviews yet</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Go to Performance page to create a review for this employee</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map((r: any) => (
                  <div key={r.id} style={{ padding: '18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', borderLeft: `3px solid ${r.rating >= 4 ? 'var(--success)' : r.rating >= 3 ? 'var(--warning)' : 'var(--danger)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{r.period} {r.year}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: r.rating >= 4 ? 'var(--success)' : r.rating >= 3 ? 'var(--warning)' : 'var(--danger)' }}>{r.rating}/5</div>
                        <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>
                          {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '14px', color: s <= r.rating ? '#F59E0B' : 'var(--border-strong)' }}>★</span>)}
                        </div>
                      </div>
                    </div>
                    {r.achievements && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}><strong style={{ color: 'var(--text-primary)' }}>Achievements: </strong>{r.achievements}</div>}
                    {r.improvements && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '4px' }}><strong style={{ color: 'var(--text-primary)' }}>Improvements: </strong>{r.improvements}</div>}
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500',
                        background: r.status === 'ACKNOWLEDGED' ? 'var(--success-bg)' : 'var(--accent-subtle)',
                        color: r.status === 'ACKNOWLEDGED' ? 'var(--success)' : 'var(--accent)',
                      }}>{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
