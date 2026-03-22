'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function JobDetailPage() {
  const { slug } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', experience: '', coverLetter: '',
  });

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/recruitment/public/jobs/${slug}`)
      .then(r => r.json())
      .then(d => setJob(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const uploadResume = async (file: File): Promise<string> => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Resume upload failed');
    const data = await res.json();
    return data.data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let resumeUrl = '';
      if (resumeFile) {
        setUploading(true);
        resumeUrl = await uploadResume(resumeFile);
        setUploading(false);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recruitment/applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, jobId: slug, resume: resumeUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setApplied(true);
    } catch (err: any) {
      setUploading(false);
      setError(err.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px', color: '#1D1D1F', fontSize: '14px', outline: 'none',
    transition: 'border-color 0.15s',
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #E5E5E5', borderTopColor: '#0066CC', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!job) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '40px' }}>😕</div>
      <div style={{ fontSize: '16px', color: '#1D1D1F', fontWeight: '600' }}>Job not found</div>
      <a href="/careers" style={{ color: '#0066CC', fontSize: '14px' }}>← Back to jobs</a>
    </div>
  );

  if (applied) return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '48px', textAlign: 'center', maxWidth: '440px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1D1D1F', marginBottom: '10px' }}>Application Submitted!</h2>
        <p style={{ fontSize: '14px', color: '#6E6E73', lineHeight: 1.6, marginBottom: '24px' }}>
          Thank you for applying for <strong>{job.title}</strong>. We'll review your application and get back to you soon.
        </p>
        <a href="/careers" style={{ display: 'inline-block', padding: '12px 24px', background: '#0066CC', color: 'white', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
          View Other Positions
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid rgba(0,0,0,0.08)', padding: '16px 24px' }}>
        <div style={{ maxWidth: '940px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/careers" style={{ color: '#6E6E73', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ← Jobs
          </a>
          <span style={{ color: '#AEAEB2' }}>›</span>
          <span style={{ fontSize: '13px', color: '#1D1D1F', fontWeight: '500' }}>{job.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: '940px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
          {/* Left — Job Info */}
          <div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '28px', border: '1px solid rgba(0,0,0,0.08)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px' }}>{job.title}</h1>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      job.department && { icon: '🏢', text: job.department },
                      job.location && { icon: '📍', text: job.location },
                      job.type && { icon: '⏱', text: job.type.replace('_', ' ') },
                      job.salary && { icon: '💰', text: job.salary },
                      job.experience && { icon: '📊', text: job.experience },
                    ].filter(Boolean).map((item: any, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#F5F5F7', borderRadius: '20px', fontSize: '12px', color: '#6E6E73' }}>
                        {item.icon} {item.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {job.deadline && (
                <div style={{ padding: '10px 14px', background: '#FFF8E1', borderRadius: '8px', fontSize: '13px', color: '#B7770D', marginBottom: '20px', border: '1px solid rgba(183,119,13,0.15)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⏰ Apply by: <strong>{new Date(job.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1D1D1F', marginBottom: '10px' }}>Job Description</h3>
                <p style={{ fontSize: '14px', color: '#6E6E73', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{job.description}</p>
              </div>

              {job.requirements && (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '20px', marginTop: '20px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1D1D1F', marginBottom: '10px' }}>Requirements</h3>
                  <p style={{ fontSize: '14px', color: '#6E6E73', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{job.requirements}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right — Application Form */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid rgba(0,0,0,0.08)', position: 'sticky', top: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#1D1D1F', marginBottom: '4px' }}>Apply Now</h2>
            <p style={{ fontSize: '13px', color: '#6E6E73', marginBottom: '20px' }}>All fields marked * are required</p>

            {error && (
              <div style={{ padding: '10px 14px', background: '#FEF0EF', border: '1px solid rgba(192,57,43,0.2)', borderRadius: '8px', color: '#C0392B', fontSize: '13px', marginBottom: '16px' }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6E6E73', marginBottom: '6px' }}>First Name *</label>
                  <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required placeholder="John" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#0066CC'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6E6E73', marginBottom: '6px' }}>Last Name *</label>
                  <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required placeholder="Doe" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#0066CC'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6E6E73', marginBottom: '6px' }}>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="john@email.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0066CC'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6E6E73', marginBottom: '6px' }}>Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+880 1700 000000" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0066CC'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6E6E73', marginBottom: '6px' }}>Years of Experience</label>
                <input value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 3 years" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#0066CC'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
              </div>

              {/* Resume Upload */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6E6E73', marginBottom: '6px' }}>
                  Resume / CV <span style={{ color: '#AEAEB2', fontWeight: '400' }}>(PDF recommended)</span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${resumeFile ? '#0066CC' : 'rgba(0,0,0,0.12)'}`,
                    borderRadius: '10px', padding: '16px', textAlign: 'center',
                    cursor: 'pointer', background: resumeFile ? 'rgba(0,102,204,0.04)' : '#F5F5F7',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#0066CC'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = resumeFile ? '#0066CC' : 'rgba(0,0,0,0.12)'}
                >
                  {resumeFile ? (
                    <div>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>📄</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#0066CC', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {resumeFile.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6E6E73' }}>
                        {(resumeFile.size / 1024 / 1024).toFixed(1)} MB · Click to change
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>📎</div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1D1D1F', marginBottom: '2px' }}>Upload Resume</div>
                      <div style={{ fontSize: '11px', color: '#AEAEB2' }}>PDF, DOC, DOCX · Max 10MB</div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) setResumeFile(f); e.target.value = ''; }} />
                {resumeFile && (
                  <button type="button" onClick={() => setResumeFile(null)} style={{ background: 'none', border: 'none', color: '#C0392B', fontSize: '12px', cursor: 'pointer', marginTop: '4px', padding: 0 }}>
                    Remove file
                  </button>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6E6E73', marginBottom: '6px' }}>Cover Letter</label>
                <textarea value={form.coverLetter} onChange={e => setForm({ ...form, coverLetter: e.target.value })} rows={4}
                  placeholder="Tell us about yourself and why you're a great fit for this role..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = '#0066CC'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'} />
              </div>

              <button type="submit" disabled={submitting} style={{
                width: '100%', padding: '14px',
                background: submitting ? '#ccc' : '#0066CC',
                border: 'none', borderRadius: '10px', color: 'white',
                fontSize: '14px', fontWeight: '700',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(0,102,204,0.25)',
                transition: 'all 0.15s',
              }}>
                {uploading ? '⬆ Uploading resume...' : submitting ? 'Submitting...' : '🚀 Submit Application'}
              </button>

              <p style={{ fontSize: '11px', color: '#AEAEB2', textAlign: 'center', marginTop: '10px', lineHeight: 1.5 }}>
                By submitting, you agree to our use of your data for recruitment purposes
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
