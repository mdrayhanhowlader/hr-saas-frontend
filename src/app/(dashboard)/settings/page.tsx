'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import PhotoUpload from '@/components/ui/PhotoUpload';

const DEFAULT_FORM_CONFIG = {
  nid: { required: false, enabled: true, label: 'National ID (NID)' },
  nidPhoto: { required: false, enabled: true, label: 'NID Photo (Front & Back)' },
  dateOfBirth: { required: false, enabled: true, label: 'Date of Birth' },
  gender: { required: false, enabled: true, label: 'Gender' },
  bloodGroup: { required: false, enabled: false, label: 'Blood Group' },
  address: { required: false, enabled: true, label: 'Address' },
  bankInfo: { required: false, enabled: true, label: 'Bank Information' },
  biometricId: { required: false, enabled: true, label: 'Biometric ID' },
  certificate: { required: false, enabled: true, label: 'Certificates' },
  cv: { required: false, enabled: true, label: 'CV / Resume' },
  photo: { required: false, enabled: true, label: 'Profile Photo' },
};

type FieldConfig = { required: boolean; enabled: boolean; label: string };
type FormConfig = Record<string, FieldConfig>;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('company');
  const [company, setCompany] = useState<any>(null);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyForm, setCompanyForm] = useState<any>({});
  const [formConfig, setFormConfig] = useState<FormConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`formConfig_${user?.tenantId}`);
      if (saved) return JSON.parse(saved);
    }
    return DEFAULT_FORM_CONFIG;
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ name: '', daysAllowed: 12, isPaid: true, carryForward: false, maxCarryDays: 0 });
  const [savingLeave, setSavingLeave] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/tenant'),
      api.get('/leaves/types'),
    ]).then(([compRes, leaveRes]) => {
      setCompany(compRes.data.data);
      setCompanyForm(compRes.data.data);
      setLeaveTypes(leaveRes.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/tenant', companyForm);
      setCompany(companyForm);
      alert('Saved!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleSaveFormConfig = () => {
    localStorage.setItem(`formConfig_${user?.tenantId}`, JSON.stringify(formConfig));
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2000);
  };

  const toggleField = (key: string, prop: 'enabled' | 'required') => {
    setFormConfig(prev => {
      const updated = { ...prev };
      if (prop === 'enabled') {
        updated[key] = { ...prev[key], enabled: !prev[key].enabled, required: prev[key].required && !prev[key].enabled };
      } else {
        updated[key] = { ...prev[key], required: !prev[key].required, enabled: !prev[key].required ? true : prev[key].enabled };
      }
      return updated;
    });
  };

  const handleAddLeaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLeave(true);
    try {
      await api.post('/leaves/types', leaveForm);
      const res = await api.get('/leaves/types');
      setLeaveTypes(res.data.data || []);
      setShowLeaveModal(false);
      setLeaveForm({ name: '', daysAllowed: 12, isPaid: true, carryForward: false, maxCarryDays: 0 });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setSavingLeave(false); }
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

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div onClick={onChange} style={{
      width: '36px', height: '20px', borderRadius: '10px', position: 'relative',
      background: checked ? 'var(--accent)' : 'var(--bg-input)',
      border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: '2px', left: checked ? '17px' : '2px',
        width: '14px', height: '14px', borderRadius: '50%', background: 'white',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </div>
  );

  const tabs = [
    { id: 'company', label: 'Company', icon: '🏢' },
    { id: 'employee_form', label: 'Employee Form', icon: '📋' },
    { id: 'leave', label: 'Leave Types', icon: '🌴' },
    { id: 'account', label: 'Account', icon: '🔐' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage your workspace configuration</p>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Sidebar */}
        <div style={{ width: '190px', flexShrink: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              width: '100%', padding: '9px 12px', marginBottom: '2px',
              borderRadius: 'var(--radius-sm)', border: 'none', textAlign: 'left',
              background: activeTab === tab.id ? 'var(--accent-subtle)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: activeTab === tab.id ? '500' : '400',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)'; }}
            onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '15px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Company ── */}
          {activeTab === 'company' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Company Information</h2>

              {loading ? <div className="skeleton" style={{ height: '300px' }} /> : (
                <form onSubmit={handleSaveCompany}>
                  {/* Logo upload */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <PhotoUpload
                      value={companyForm.logo}
                      onChange={url => setCompanyForm({ ...companyForm, logo: url })}
                      size={64}
                      initials={companyForm.name?.[0] || 'C'}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>Company Logo</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Shown in sidebar and reports</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Company Name</label>
                      <input value={companyForm.name || ''} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Phone</label>
                      <input value={companyForm.phone || ''} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                    <div>
                      <label style={labelStyle}>Industry</label>
                      <select value={companyForm.industry || ''} onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="" style={{ background: '#111' }}>Select</option>
                        {['Technology','Finance','Healthcare','Education','Retail','Manufacturing','Other'].map(i => <option key={i} value={i} style={{ background: '#111' }}>{i}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Currency</label>
                      <select value={companyForm.currency || 'BDT'} onChange={e => setCompanyForm({ ...companyForm, currency: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {['BDT','USD','EUR','GBP','INR','SGD'].map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Timezone</label>
                      <select value={companyForm.timezone || 'Asia/Dhaka'} onChange={e => setCompanyForm({ ...companyForm, timezone: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                        {['Asia/Dhaka','Asia/Kolkata','Asia/Singapore','Europe/London','America/New_York','America/Los_Angeles'].map(t => <option key={t} value={t} style={{ background: '#111' }}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Address</label>
                      <input value={companyForm.address || ''} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} style={inputStyle}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" disabled={saving} style={{ padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Employee Form Config ── */}
          {activeTab === 'employee_form' && (
            <div>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Employee Form Fields</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Control which fields are shown and required when adding employees</p>
                  </div>
                  <button onClick={handleSaveFormConfig} style={{
                    padding: '8px 16px', background: configSaved ? 'var(--success)' : 'var(--accent)',
                    border: 'none', borderRadius: 'var(--radius-sm)', color: 'white',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.3s',
                  }}>
                    {configSaved ? '✓ Saved!' : 'Save Config'}
                  </button>
                </div>

                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: '8px', padding: '8px 14px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Field</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Show</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Required</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {Object.entries(formConfig).map(([key, field]) => (
                    <div key={key} style={{
                      display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: '8px',
                      padding: '12px 14px', background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                      alignItems: 'center', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: field.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)', transition: 'color 0.15s' }}>{field.label}</div>
                        {field.required && field.enabled && (
                          <span style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: '500' }}>Required during employee creation</span>
                        )}
                      </div>

                      {/* Show toggle */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Toggle checked={field.enabled} onChange={() => toggleField(key, 'enabled')} />
                      </div>

                      {/* Required toggle */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Toggle
                          checked={field.required}
                          onChange={() => field.enabled && toggleField(key, 'required')}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '14px 16px', background: 'var(--accent-subtle)', border: '1px solid rgba(41,151,255,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--accent)' }}>💡 How it works:</strong><br/>
                • <strong style={{ color: 'var(--text-primary)' }}>Show OFF</strong> — field hidden completely from the form<br/>
                • <strong style={{ color: 'var(--text-primary)' }}>Show ON, Required OFF</strong> — field visible but optional<br/>
                • <strong style={{ color: 'var(--text-primary)' }}>Show ON, Required ON</strong> — field must be filled before saving<br/>
                • Changes take effect immediately for new employee creation
              </div>
            </div>
          )}

          {/* ── Leave Types ── */}
          {activeTab === 'leave' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>Leave Types</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Configure leave policies for your company</p>
                </div>
                <button onClick={() => setShowLeaveModal(true)} style={{ padding: '8px 14px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  + Add Type
                </button>
              </div>

              {leaveTypes.length === 0 ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌴</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>No leave types yet</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Add leave types so employees can apply</div>
                  <button onClick={() => setShowLeaveModal(true)} style={{ padding: '9px 18px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    Add First Leave Type
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {leaveTypes.map(lt => (
                    <div key={lt.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🌴</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '5px' }}>{lt.name}</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: 'var(--radius-full)', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{lt.daysAllowed} days/year</span>
                          <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: 'var(--radius-full)', background: lt.isPaid ? 'var(--success-bg)' : 'var(--warning-bg)', color: lt.isPaid ? 'var(--success)' : 'var(--warning)' }}>
                            {lt.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                          {lt.carryForward && (
                            <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: 'var(--radius-full)', background: 'var(--purple-bg)', color: 'var(--purple)' }}>
                              Carry Forward {lt.maxCarryDays}d
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: lt.isActive ? 'var(--success)' : 'var(--danger)' }} />
                        <span style={{ fontSize: '12px', color: lt.isActive ? 'var(--success)' : 'var(--danger)' }}>{lt.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Leave Type Modal */}
              {showLeaveModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowLeaveModal(false)}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <div>
                        <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>Add Leave Type</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Configure a new leave policy</p>
                      </div>
                      <button onClick={() => setShowLeaveModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
                    </div>
                    <form onSubmit={handleAddLeaveType}>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={labelStyle}>Leave Type Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <input value={leaveForm.name} onChange={e => setLeaveForm({ ...leaveForm, name: e.target.value })} required
                          placeholder="e.g. Annual Leave, Sick Leave, Casual Leave" style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Days Allowed Per Year <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <input type="number" min="1" max="365" value={leaveForm.daysAllowed}
                          onChange={e => setLeaveForm({ ...leaveForm, daysAllowed: Number(e.target.value) })} required style={inputStyle}
                          onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                      </div>

                      {/* Toggles */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        {[
                          { key: 'isPaid', label: 'Paid Leave', desc: 'Employee gets paid salary during this leave' },
                          { key: 'carryForward', label: 'Allow Carry Forward', desc: 'Unused days roll over to next year' },
                        ].map(toggle => (
                          <label key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{toggle.label}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{toggle.desc}</div>
                            </div>
                            <div style={{
                              width: '40px', height: '22px', borderRadius: '11px', position: 'relative',
                              background: (leaveForm as any)[toggle.key] ? 'var(--accent)' : 'var(--bg-input)',
                              border: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer',
                            }} onClick={() => setLeaveForm({ ...leaveForm, [toggle.key]: !(leaveForm as any)[toggle.key] })}>
                              <div style={{ position: 'absolute', top: '2px', left: (leaveForm as any)[toggle.key] ? '19px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                            </div>
                          </label>
                        ))}

                        {leaveForm.carryForward && (
                          <div style={{ padding: '0 14px' }}>
                            <label style={labelStyle}>Max Carry Forward Days</label>
                            <input type="number" min="0" value={leaveForm.maxCarryDays}
                              onChange={e => setLeaveForm({ ...leaveForm, maxCarryDays: Number(e.target.value) })}
                              style={{ ...inputStyle, width: '120px' }}
                              onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={() => setShowLeaveModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={savingLeave} style={{ flex: 2, padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: savingLeave ? 'not-allowed' : 'pointer' }}>
                          {savingLeave ? 'Adding...' : 'Add Leave Type'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Account ── */}
          {activeTab === 'account' && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>Change Password</h2>
              <ChangePasswordForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const inputStyle = { width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { setMsg({ type: 'error', text: 'Passwords do not match' }); return; }
    if (form.newPassword.length < 6) { setMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg({ type: 'success', text: '✓ Password changed successfully' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '360px' }}>
      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px', background: msg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', color: msg.type === 'success' ? 'var(--success)' : 'var(--danger)', border: `1px solid ${msg.type === 'success' ? 'rgba(50,215,75,0.15)' : 'rgba(255,69,58,0.15)'}` }}>
          {msg.text}
        </div>
      )}
      {[
        { label: 'Current Password', key: 'currentPassword' },
        { label: 'New Password', key: 'newPassword' },
        { label: 'Confirm New Password', key: 'confirmPassword' },
      ].map(f => (
        <div key={f.key} style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>{f.label}</label>
          <input type="password" value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} required style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
      ))}
      <button type="submit" disabled={saving} style={{ padding: '10px 20px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}
