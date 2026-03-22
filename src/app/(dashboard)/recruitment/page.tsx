'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

const STAGES = [
  { id: 'APPLIED', label: 'Applied', color: 'var(--text-secondary)', bg: 'rgba(100,100,100,0.08)', icon: '📥' },
  { id: 'SCREENING', label: 'Screening', color: 'var(--accent)', bg: 'var(--accent-subtle)', icon: '🔍' },
  { id: 'INTERVIEW', label: 'Interview', color: 'var(--warning)', bg: 'var(--warning-bg)', icon: '🎤' },
  { id: 'OFFER', label: 'Offer', color: 'var(--purple)', bg: 'var(--purple-bg)', icon: '📋' },
  { id: 'HIRED', label: 'Hired', color: 'var(--success)', bg: 'var(--success-bg)', icon: '✓' },
  { id: 'REJECTED', label: 'Rejected', color: 'var(--danger)', bg: 'var(--danger-bg)', icon: '✗' },
];

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'kanban' | 'jobs'>('kanban');
  const [saving, setSaving] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', department: '', location: '', type: 'FULL_TIME', experience: '', salary: '', description: '', requirements: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [jobRes, appRes] = await Promise.all([
        api.get('/recruitment/jobs'),
        api.get('/recruitment/applicants'),
      ]);
      setJobs(jobRes.data.data || []);
      setApplicants(appRes.data.data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredApplicants = selectedJob === 'all' ? applicants : applicants.filter(a => a.jobId === selectedJob);

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOver(null);
    const applicantId = e.dataTransfer.getData('applicantId');
    if (!applicantId) return;
    try {
      await api.put(`/recruitment/applicants/${applicantId}/status`, { status: newStatus });
      setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, status: newStatus } : a));
    } catch { fetchData(); }
  };

  const handleStatusChange = async (id: string, status: string, interviewDate?: string) => {
    try {
      await api.put(`/recruitment/applicants/${id}/status`, { status, interviewDate });
      fetchData();
      setShowApplicantModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/recruitment/jobs', jobForm);
      setShowJobModal(false);
      setJobForm({ title: '', department: '', location: '', type: 'FULL_TIME', experience: '', salary: '', description: '', requirements: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
    fontSize: '13px', outline: 'none',
  };

  const jobStatusStyle: any = {
    OPEN: { color: 'var(--success)', bg: 'var(--success-bg)' },
    CLOSED: { color: 'var(--danger)', bg: 'var(--danger-bg)' },
    ON_HOLD: { color: 'var(--warning)', bg: 'var(--warning-bg)' },
  };

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Recruitment</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{applicants.length} applicants · {jobs.filter(j => j.status === 'OPEN').length} open positions</p>
        </div>
        <button onClick={() => setShowJobModal(true)} style={{ padding: '9px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', boxShadow: 'var(--shadow-glow)' }}>
          + Post Job
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '3px', width: 'fit-content' }}>
        {[{ id: 'kanban', label: '⠿ Kanban Board' }, { id: 'jobs', label: '📋 Job Postings' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
            padding: '7px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', cursor: 'pointer',
            background: activeTab === tab.id ? 'var(--bg-base)' : 'transparent',
            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === tab.id ? '500' : '400',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* Job filter */}
      {activeTab === 'kanban' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => setSelectedJob('all')} style={{
            padding: '6px 14px', borderRadius: 'var(--radius-full)', border: `1px solid ${selectedJob === 'all' ? 'var(--accent)' : 'var(--border)'}`,
            background: selectedJob === 'all' ? 'var(--accent-subtle)' : 'var(--bg-card)',
            color: selectedJob === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: '12px', fontWeight: '500', cursor: 'pointer',
          }}>All Positions ({applicants.length})</button>
          {jobs.filter(j => j.status === 'OPEN').map(job => (
            <button key={job.id} onClick={() => setSelectedJob(job.id)} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              border: `1px solid ${selectedJob === job.id ? 'var(--accent)' : 'var(--border)'}`,
              background: selectedJob === job.id ? 'var(--accent-subtle)' : 'var(--bg-card)',
              color: selectedJob === job.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '12px', fontWeight: '500', cursor: 'pointer',
            }}>{job.title} ({job._count?.applicants || 0})</button>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      {activeTab === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', overflowX: 'auto', minHeight: '500px' }}>
          {STAGES.map(stage => {
            const stageApplicants = filteredApplicants.filter(a => a.status === stage.id);
            return (
              <div key={stage.id}
                onDragOver={e => { e.preventDefault(); setDragOver(stage.id); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => handleDrop(e, stage.id)}
                style={{
                  background: dragOver === stage.id ? stage.bg : 'var(--bg-card)',
                  border: `1px solid ${dragOver === stage.id ? stage.color : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)', padding: '12px',
                  transition: 'all 0.15s', minHeight: '400px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', padding: '6px 8px', background: stage.bg, borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '14px' }}>{stage.icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: stage.color, flex: 1 }}>{stage.label}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: stage.color, background: 'white', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{stageApplicants.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {stageApplicants.map(app => (
                    <div key={app.id}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('applicantId', app.id)}
                      onClick={() => { setSelectedApplicant(app); setShowApplicantModal(true); }}
                      style={{
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '10px',
                        cursor: 'grab', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '3px' }}>
                        {app.firstName} {app.lastName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.job?.title}
                      </div>
                      {app.email && (
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.email}
                        </div>
                      )}
                      {app.interviewDate && (
                        <div style={{ marginTop: '6px', padding: '3px 6px', background: 'var(--warning-bg)', borderRadius: '4px', fontSize: '10px', color: 'var(--warning)', fontWeight: '500' }}>
                          📅 {new Date(app.interviewDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                  {stageApplicants.length === 0 && (
                    <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {jobs.length === 0 ? (
            <div style={{ gridColumn: 'span 2', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>No job postings yet</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Post your first job to start recruiting</div>
            </div>
          ) : jobs.map(job => {
            const js = jobStatusStyle[job.status] || jobStatusStyle.OPEN;
            return (
              <div key={job.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', flex: 1 }}>{job.title}</h3>
                  <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500', background: js.bg, color: js.color, marginLeft: '8px', flexShrink: 0 }}>{job.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {job.department && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🏢 {job.department}</span>}
                  {job.location && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📍 {job.location}</span>}
                  {job.type && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>⏱ {job.type.replace('_', ' ')}</span>}
                  {job.salary && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>💰 {job.salary}</span>}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {job.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>👥 {job._count?.applicants || 0} applicants</span>
                  {job.deadline && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {job.status === 'OPEN' ? (
                      <button onClick={async () => { await api.put(`/recruitment/jobs/${job.id}`, { status: 'CLOSED' }); fetchData(); }} style={{ padding: '5px 10px', background: 'var(--danger-bg)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '6px', color: 'var(--danger)', fontSize: '11px', cursor: 'pointer' }}>Close</button>
                    ) : (
                      <button onClick={async () => { await api.put(`/recruitment/jobs/${job.id}`, { status: 'OPEN' }); fetchData(); }} style={{ padding: '5px 10px', background: 'var(--success-bg)', border: '1px solid rgba(29,131,72,0.2)', borderRadius: '6px', color: 'var(--success)', fontSize: '11px', cursor: 'pointer' }}>Reopen</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Applicant Detail Modal */}
      {showApplicantModal && selectedApplicant && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowApplicantModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Applicant Profile</h2>
              <button onClick={() => setShowApplicantModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid var(--border)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', color: 'var(--accent)', flexShrink: 0 }}>
                {selectedApplicant.firstName?.[0]}{selectedApplicant.lastName?.[0]}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{selectedApplicant.firstName} {selectedApplicant.lastName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedApplicant.email}</div>
                {selectedApplicant.phone && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{selectedApplicant.phone}</div>}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Position</div>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{selectedApplicant.job?.title}</div>
            </div>

            {selectedApplicant.experience && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Experience</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  {selectedApplicant.experience}
                </div>
              </div>
            )}

            {selectedApplicant.coverLetter && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Cover Letter</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', maxHeight: '120px', overflowY: 'auto' }}>
                  {selectedApplicant.coverLetter}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Move to Stage</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {STAGES.map(stage => (
                  <button key={stage.id} onClick={() => handleStatusChange(selectedApplicant.id, stage.id)} style={{
                    padding: '8px 6px', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${selectedApplicant.status === stage.id ? stage.color : 'var(--border)'}`,
                    background: selectedApplicant.status === stage.id ? stage.bg : 'var(--bg-input)',
                    color: selectedApplicant.status === stage.id ? stage.color : 'var(--text-secondary)',
                    fontSize: '11px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {stage.icon} {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedApplicant.resume && (
              <a href={selectedApplicant.resume} target="_blank" rel="noreferrer" style={{ display: 'block', padding: '10px 14px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '13px', fontWeight: '500', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}>
                📄 View Resume
              </a>
            )}
          </div>
        </div>
      )}

      {/* Post Job Modal */}
      {showJobModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowJobModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '28px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Post New Job</h2>
              <button onClick={() => setShowJobModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
            </div>
            <form onSubmit={handleJobSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Job Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required placeholder="Senior Software Engineer" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                {[
                  { key: 'department', label: 'Department', placeholder: 'Engineering' },
                  { key: 'location', label: 'Location', placeholder: 'Dhaka, BD' },
                  { key: 'experience', label: 'Experience', placeholder: '2-3 years' },
                  { key: 'salary', label: 'Salary Range', placeholder: '50k-80k BDT' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>{f.label}</label>
                    <input value={(jobForm as any)[f.key]} onChange={e => setJobForm({ ...jobForm, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Description <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} required rows={4} placeholder="Job description..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Requirements</label>
                  <textarea value={jobForm.requirements} onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })} rows={3} placeholder="Requirements..." style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowJobModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Posting...' : '🎯 Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
