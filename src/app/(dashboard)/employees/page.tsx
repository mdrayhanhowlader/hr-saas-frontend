'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';
import PhotoUpload from '@/components/ui/PhotoUpload';
import CredentialsModal from '@/components/ui/CredentialsModal';

const EMPLOYEE_ROLES = [
  { value: 'EMPLOYEE', label: 'Employee', desc: 'Standard access — own data only' },
  { value: 'MANAGER', label: 'Manager', desc: 'Team view — attendance, leaves' },
  { value: 'HR_ADMIN', label: 'HR Admin', desc: 'Full HR access — all modules' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full system access' },
];

const DEPARTMENTS_DEFAULT = ['Engineering','Product','Design','Marketing','Sales','Finance','HR','Operations','Legal','Customer Support'];

const DESIGNATIONS: any = {
  Engineering: ['Software Engineer','Senior Engineer','Lead Engineer','Engineering Manager','CTO','DevOps Engineer','QA Engineer'],
  Product: ['Product Manager','Senior PM','VP of Product','CPO'],
  Design: ['UI/UX Designer','Senior Designer','Design Lead','Creative Director'],
  Marketing: ['Marketing Executive','Marketing Manager','Content Writer','CMO'],
  Sales: ['Sales Executive','Account Manager','Sales Manager','VP of Sales'],
  Finance: ['Accountant','Senior Accountant','Finance Manager','CFO'],
  HR: ['HR Executive','HR Manager','Talent Acquisition','CHRO'],
  Operations: ['Operations Executive','Operations Manager','COO'],
  Legal: ['Legal Counsel','Compliance Officer'],
  'Customer Support': ['Support Executive','Support Lead','Customer Success Manager'],
};

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
type FormStep = 'basic' | 'personal' | 'employment' | 'documents';
const STEPS: { id: FormStep; label: string; icon: string }[] = [
  { id: 'basic', label: 'Basic Info', icon: '👤' },
  { id: 'personal', label: 'Personal', icon: '📋' },
  { id: 'employment', label: 'Employment', icon: '💼' },
  { id: 'documents', label: 'Documents', icon: '📄' },
];

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<FormStep>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<any>(null);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    photo: '', role: 'EMPLOYEE',
    dateOfBirth: '', gender: '', bloodGroup: '',
    nationalId: '', address: '', city: '', country: 'Bangladesh',
    departmentId: '', departmentName: '', designation: '',
    employmentType: 'FULL_TIME', joiningDate: '', basicSalary: '',
    confirmationDate: '', managerId: '', biometricId: '',
    bankName: '', bankAccount: '', bankBranch: '',
    nidFront: '', nidBack: '', certificate1: '', certificate2: '',
    cv: '', offerLetter: '',
  });

  const setF = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const fetchEmployees = async () => {
    try {
      const res = await api.get(`/employees?search=${search}&limit=50`);
      setEmployees(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, [search]);

  const resetForm = () => {
    setForm({
      firstName: '', lastName: '', email: '', phone: '', photo: '', role: 'EMPLOYEE',
      dateOfBirth: '', gender: '', bloodGroup: '', nationalId: '', address: '', city: '', country: 'Bangladesh',
      departmentId: '', departmentName: '', designation: '', employmentType: 'FULL_TIME',
      joiningDate: '', basicSalary: '', confirmationDate: '', managerId: '', biometricId: '',
      bankName: '', bankAccount: '', bankBranch: '',
      nidFront: '', nidBack: '', certificate1: '', certificate2: '', cv: '', offerLetter: '',
    });
    setStep('basic');
    setError('');
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/employees', form);
      setShowModal(false);
      resetForm();
      fetchEmployees();
      if (res.data.data?.tempPassword) {
        setCredentials({
          email: form.email,
          tempPassword: res.data.data.tempPassword,
          employeeId: res.data.data.employeeId,
          firstName: form.firstName,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create employee');
    } finally { setSaving(false); }
  };

  const canProceed = () => {
    if (step === 'basic') return form.firstName && form.lastName && form.email;
    if (step === 'employment') return !!form.joiningDate;
    return true;
  };

  const nextStep = () => {
    const order: FormStep[] = ['basic', 'personal', 'employment', 'documents'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  const prevStep = () => {
    const order: FormStep[] = ['basic', 'personal', 'employment', 'documents'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: '500',
    color: 'var(--text-secondary)', marginBottom: '7px',
  };

  const currentDesignations = form.departmentName ? (DESIGNATIONS[form.departmentName] || []) : [];

  const FileUploadField = ({ label, fieldKey, optional = true }: { label: string; fieldKey: string; optional?: boolean }) => {
    const [uploading, setUploading] = useState(false);
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
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
        setF(fieldKey, data.data.url);
      } catch { alert('Upload failed'); }
      finally { setUploading(false); }
    };
    const val = (form as any)[fieldKey];
    return (
      <div>
        <label style={labelStyle}>{label} {optional && <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>(optional)</span>}</label>
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {val ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--success-bg)' }}>
              <span style={{ fontSize: '12px', color: 'var(--success)', flex: 1 }}>✓ Uploaded</span>
              <a href={val} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--accent)' }}>View</a>
              <button onClick={() => setF(fieldKey, '')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>
          ) : (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', cursor: 'pointer', background: 'var(--bg-input)' }}>
              {uploading ? (
                <div style={{ width: '14px', height: '14px', border: '2px solid var(--border-medium)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <svg width="14" height="14" fill="none" stroke="var(--text-tertiary)" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              )}
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{uploading ? 'Uploading...' : 'Click to upload'}</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={handleFile} />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {credentials && <CredentialsModal data={credentials} onClose={() => setCredentials(null)} />}

      <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Employees</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{employees.length} team members</p>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} style={{
            padding: '9px 16px', background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px',
            fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-glow)',
          }}>+ Add Employee</button>
        </div>

        <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '340px' }}>
          <svg width="14" height="14" fill="none" stroke="var(--text-tertiary)" viewBox="0 0 24 24" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" strokeWidth="1.5"/><path strokeWidth="1.5" strokeLinecap="round" d="M21 21l-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, ID..."
            style={{ ...inputStyle, paddingLeft: '36px' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Employee','ID','Department','Designation','Type','Status','Salary','Joined'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}><td colSpan={8} style={{ padding: '12px 16px' }}><div className="skeleton" style={{ height: '36px' }} /></td></tr>
                ))
              ) : employees.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '60px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '4px' }}>No employees yet</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Add your first team member</div>
                </td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} onClick={() => router.push(`/employees/${emp.id}`)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {emp.photo ? (
                        <img src={emp.photo} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `hsl(${(emp.firstName?.charCodeAt(0) || 0) * 15 % 360}, 55%, 40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                          {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.firstName} {emp.lastName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{emp.employeeId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.department?.name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.designation || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                      {emp.employmentType?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500', background: emp.employmentStatus === 'ACTIVE' ? 'var(--success-bg)' : 'var(--danger-bg)', color: emp.employmentStatus === 'ACTIVE' ? 'var(--success)' : 'var(--danger)' }}>
                      {emp.employmentStatus}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>৳{Number(emp.basicSalary).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {new Date(emp.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }} onClick={() => setShowModal(false)}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '640px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Add New Employee</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Fill in employee information step by step</p>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>×</button>
                </div>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                  {STEPS.map((s, i) => {
                    const stepOrder = STEPS.map(x => x.id);
                    const currentIdx = stepOrder.indexOf(step);
                    const isDone = i < currentIdx;
                    const isActive = s.id === step;
                    return (
                      <div key={s.id} style={{ flex: 1 }}>
                        <div onClick={() => isDone && setStep(s.id)} style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: isActive ? 'var(--accent-subtle)' : isDone ? 'var(--success-bg)' : 'var(--bg-elevated)',
                          border: `1px solid ${isActive ? 'rgba(41,151,255,0.2)' : isDone ? 'rgba(29,131,72,0.15)' : 'var(--border)'}`,
                          cursor: isDone ? 'pointer' : 'default',
                        }}>
                          <span style={{ fontSize: '13px' }}>{isDone ? '✓' : s.icon}</span>
                          <span style={{ fontSize: '11px', fontWeight: '500', color: isActive ? 'var(--accent)' : isDone ? 'var(--success)' : 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
                {error && (
                  <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '13px', marginBottom: '16px' }}>
                    {error}
                  </div>
                )}

                {step === 'basic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                      <PhotoUpload value={form.photo} onChange={v => setF('photo', v)} size={90} initials={`${form.firstName?.[0] || '?'}${form.lastName?.[0] || ''}`} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={labelStyle}>First Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <input value={form.firstName} onChange={e => setF('firstName', e.target.value)} required placeholder="John" style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                      <div>
                        <label style={labelStyle}>Last Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <input value={form.lastName} onChange={e => setF('lastName', e.target.value)} required placeholder="Doe" style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Work Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                      <input type="email" value={form.email} onChange={e => setF('email', e.target.value)} required placeholder="john@company.com" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+880 1700 000000" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>System Role <span style={{ color: 'var(--danger)' }}>*</span></label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {EMPLOYEE_ROLES.map(r => (
                          <div key={r.value} onClick={() => setF('role', r.value)} style={{
                            padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            border: `1px solid ${form.role === r.value ? 'var(--accent)' : 'var(--border)'}`,
                            background: form.role === r.value ? 'var(--accent-subtle)' : 'var(--bg-input)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: form.role === r.value ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                              <span style={{ fontSize: '13px', fontWeight: '500', color: form.role === r.value ? 'var(--accent)' : 'var(--text-primary)' }}>{r.label}</span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', paddingLeft: '14px' }}>{r.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 'personal' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingBottom: '8px' }}>
                    <div>
                      <label style={labelStyle}>Date of Birth</label>
                      <DatePicker value={form.dateOfBirth} onChange={v => setF('dateOfBirth', v)} placeholder="Select DOB" maxDate={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div>
                      <label style={labelStyle}>Gender</label>
                      <select value={form.gender} onChange={e => setF('gender', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="" style={{ background: 'var(--bg-card)' }}>Select</option>
                        {['MALE','FEMALE','OTHER'].map(g => <option key={g} value={g} style={{ background: 'var(--bg-card)' }}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Blood Group</label>
                      <select value={form.bloodGroup} onChange={e => setF('bloodGroup', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="" style={{ background: 'var(--bg-card)' }}>Select</option>
                        {BLOOD_GROUPS.map(b => <option key={b} value={b} style={{ background: 'var(--bg-card)' }}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>National ID (NID)</label>
                      <input value={form.nationalId} onChange={e => setF('nationalId', e.target.value)} placeholder="1234567890123" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Address</label>
                      <input value={form.address} onChange={e => setF('address', e.target.value)} placeholder="House, Road, Area" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>City</label>
                      <input value={form.city} onChange={e => setF('city', e.target.value)} placeholder="Dhaka" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Country</label>
                      <input value={form.country} onChange={e => setF('country', e.target.value)} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                  </div>
                )}

                {step === 'employment' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingBottom: '8px' }}>
                    <div>
                      <label style={labelStyle}>Department</label>
                      <select value={form.departmentName} onChange={e => setF('departmentName', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="" style={{ background: 'var(--bg-card)' }}>Select department</option>
                        {DEPARTMENTS_DEFAULT.map(d => <option key={d} value={d} style={{ background: 'var(--bg-card)' }}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Designation</label>
                      {currentDesignations.length > 0 ? (
                        <select value={form.designation} onChange={e => setF('designation', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="" style={{ background: 'var(--bg-card)' }}>Select</option>
                          {currentDesignations.map((d: string) => <option key={d} value={d} style={{ background: 'var(--bg-card)' }}>{d}</option>)}
                        </select>
                      ) : (
                        <input value={form.designation} onChange={e => setF('designation', e.target.value)} placeholder="e.g. Software Engineer" style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      )}
                    </div>
                    <div>
                      <label style={labelStyle}>Employment Type <span style={{ color: 'var(--danger)' }}>*</span></label>
                      <select value={form.employmentType} onChange={e => setF('employmentType', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {[['FULL_TIME','Full Time'],['PART_TIME','Part Time'],['CONTRACT','Contract'],['INTERN','Intern']].map(([v,l]) => (
                          <option key={v} value={v} style={{ background: 'var(--bg-card)' }}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Basic Salary (BDT)</label>
                      <input type="number" value={form.basicSalary} onChange={e => setF('basicSalary', e.target.value)} placeholder="50000" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Joining Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                      <DatePicker value={form.joiningDate} onChange={v => setF('joiningDate', v)} placeholder="Select joining date" />
                    </div>
                    <div>
                      <label style={labelStyle}>Confirmation Date</label>
                      <DatePicker value={form.confirmationDate} onChange={v => setF('confirmationDate', v)} placeholder="Select date" />
                    </div>
                    <div>
                      <label style={labelStyle}>Biometric ID</label>
                      <input value={form.biometricId} onChange={e => setF('biometricId', e.target.value)} placeholder="Device user ID" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div />
                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Bank Information</div>
                    </div>
                    <div>
                      <label style={labelStyle}>Bank Name</label>
                      <input value={form.bankName} onChange={e => setF('bankName', e.target.value)} placeholder="Dutch Bangla Bank" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Account Number</label>
                      <input value={form.bankAccount} onChange={e => setF('bankAccount', e.target.value)} placeholder="Account number" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Branch</label>
                      <input value={form.bankBranch} onChange={e => setF('bankBranch', e.target.value)} placeholder="Gulshan Branch" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                  </div>
                )}

                {step === 'documents' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '8px' }}>
                    <div style={{ padding: '12px 14px', background: 'var(--accent-subtle)', border: '1px solid rgba(41,151,255,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--accent)' }}>
                      💡 All documents are optional. You can upload them later from the employee profile.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <FileUploadField label="NID Front" fieldKey="nidFront" />
                      <FileUploadField label="NID Back" fieldKey="nidBack" />
                    </div>
                    <FileUploadField label="CV / Resume" fieldKey="cv" />
                    <FileUploadField label="Educational Certificate" fieldKey="certificate1" />
                    <FileUploadField label="Offer Letter" fieldKey="offerLetter" />

                    <div style={{ padding: '14px', background: 'var(--accent-subtle)', border: '1px solid rgba(41,151,255,0.15)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', marginBottom: '8px' }}>🔐 Login Credentials</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        <div>Email: <strong style={{ color: 'var(--text-primary)' }}>{form.email || '—'}</strong></div>
                        <div>Password: <strong style={{ color: 'var(--text-primary)' }}>Auto-generated temporary password</strong></div>
                        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-tertiary)' }}>Credentials will be shown after creating. An email will also be sent.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  Step {STEPS.findIndex(s => s.id === step) + 1} of {STEPS.length}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {step !== 'basic' && (
                    <button onClick={prevStep} style={{ padding: '9px 16px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
                      ← Back
                    </button>
                  )}
                  {step !== 'documents' ? (
                    <button onClick={nextStep} disabled={!canProceed()} style={{
                      padding: '9px 20px',
                      background: canProceed() ? 'var(--accent)' : 'var(--bg-elevated)',
                      border: 'none', borderRadius: 'var(--radius-sm)',
                      color: canProceed() ? 'white' : 'var(--text-tertiary)',
                      fontSize: '13px', fontWeight: '600',
                      cursor: canProceed() ? 'pointer' : 'not-allowed',
                    }}>
                      Next →
                    </button>
                  ) : (
                    <button onClick={handleSubmit} disabled={saving} style={{
                      padding: '9px 20px', background: 'var(--accent)', border: 'none',
                      borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px',
                      fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer',
                    }}>
                      {saving ? 'Creating...' : '✓ Create Employee'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
