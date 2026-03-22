'use client';

import { useEffect, useState } from 'react';

export default function CareersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('company') || '';
    setCompany(slug);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/recruitment/public/jobs?slug=${slug}`)
      .then(r => r.json())
      .then(d => setJobs(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', background: '#0066CC', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: 'white', margin: '0 auto 16px' }}>HR</div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1D1D1F', marginBottom: '8px' }}>Open Positions</h1>
          <p style={{ fontSize: '15px', color: '#6E6E73' }}>Join our team and make a difference</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#6E6E73', padding: '40px' }}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '60px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1D1D1F', marginBottom: '8px' }}>No open positions right now</div>
            <div style={{ fontSize: '14px', color: '#6E6E73' }}>Check back later for new opportunities</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {jobs.map((job: any) => (
              <a key={job.id} href={`/careers/${job.id}`} style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid rgba(0,0,0,0.08)', textDecoration: 'none', display: 'block', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#1D1D1F', marginBottom: '8px' }}>{job.title}</h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {job.department && <span style={{ fontSize: '13px', color: '#6E6E73' }}>🏢 {job.department}</span>}
                      {job.location && <span style={{ fontSize: '13px', color: '#6E6E73' }}>📍 {job.location}</span>}
                      {job.type && <span style={{ fontSize: '13px', color: '#6E6E73' }}>⏱ {job.type.replace('_', ' ')}</span>}
                      {job.salary && <span style={{ fontSize: '13px', color: '#6E6E73' }}>💰 {job.salary}</span>}
                      {job.experience && <span style={{ fontSize: '13px', color: '#6E6E73' }}>📊 {job.experience}</span>}
                    </div>
                  </div>
                  <span style={{ padding: '6px 14px', background: '#E8F4FF', color: '#0066CC', borderRadius: '20px', fontSize: '13px', fontWeight: '600', flexShrink: 0, marginLeft: '16px' }}>Apply →</span>
                </div>
                {job.description && (
                  <p style={{ fontSize: '13px', color: '#6E6E73', lineHeight: 1.6, marginTop: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.description}
                  </p>
                )}
                {job.deadline && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#AEAEB2' }}>
                    Apply by: {new Date(job.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
