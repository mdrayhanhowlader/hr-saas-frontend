'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

interface Widget { id: string; label: string; enabled: boolean; }

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'total_employees', label: 'Total Employees', enabled: true },
  { id: 'present_today', label: 'Present Today', enabled: true },
  { id: 'on_leave', label: 'On Leave', enabled: true },
  { id: 'pending_leaves', label: 'Pending Leaves', enabled: true },
  { id: 'open_jobs', label: 'Open Positions', enabled: true },
  { id: 'monthly_payroll', label: 'Monthly Payroll', enabled: true },
  { id: 'recent_employees', label: 'Recent Employees', enabled: true },
  { id: 'announcements', label: 'Announcements', enabled: true },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = ['HR_ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(user?.role || '');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`widgets_${user?.tenantId}`);
      if (saved) return JSON.parse(saved);
    }
    return DEFAULT_WIDGETS;
  });
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    api.get('/dashboard').then(res => setStats(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveWidgets = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(`widgets_${user?.tenantId}`, JSON.stringify(newWidgets));
  };

  const isEnabled = (id: string) => widgets.find(w => w.id === id)?.enabled !== false;

  const statCards = stats ? [
    { id: 'total_employees', label: 'Total Employees', value: stats.overview.totalEmployees, change: 'All time', icon: '👥', color: 'var(--accent)', bg: 'var(--accent-subtle)' },
    { id: 'present_today', label: 'Present Today', value: stats.overview.presentToday, change: `of ${stats.overview.activeEmployees} active`, icon: '✓', color: 'var(--success)', bg: 'var(--success-bg)' },
    { id: 'on_leave', label: 'On Leave', value: stats.overview.onLeaveToday, change: 'Today', icon: '🌴', color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { id: 'pending_leaves', label: 'Pending Leaves', value: stats.overview.pendingLeaves, change: 'Awaiting approval', icon: '⏳', color: 'var(--purple)', bg: 'var(--purple-bg)' },
    { id: 'open_jobs', label: 'Open Positions', value: stats.overview.openJobs, change: 'Active listings', icon: '🎯', color: 'var(--teal)', bg: 'var(--teal-bg)' },
    { id: 'monthly_payroll', label: 'Monthly Payroll', value: `৳${Number(stats.payroll?.totalNet || 0).toLocaleString()}`, change: 'Net this month', icon: '💰', color: '#32D74B', bg: 'rgba(50,215,75,0.1)' },
  ].filter(c => isEnabled(c.id)) : [];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>
            {getGreeting()}, {user?.companyName?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCustomize(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Customize
          </button>
        )}
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: '100px' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {statCards.map((card, i) => (
            <div key={card.id} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '20px',
              transition: 'all 0.2s', cursor: 'default',
              animationDelay: `${i * 0.05}s`,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>{card.label}</div>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{card.icon}</div>
              </div>
              <div style={{ fontSize: '30px', fontWeight: '700', color: card.color, letterSpacing: '-0.5px', marginBottom: '4px' }}>{card.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{card.change}</div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Recent Employees */}
        {isEnabled('recent_employees') && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Recent Employees</span>
              <a href="/employees" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
            </div>
            {loading ? (
              <div style={{ padding: '20px' }}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '44px', marginBottom: '8px' }} />)}</div>
            ) : !stats?.recentEmployees?.length ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No employees yet. <a href="/employees" style={{ color: 'var(--accent)' }}>Add first →</a>
              </div>
            ) : stats.recentEmployees.map((emp: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: i < stats.recentEmployees.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `hsl(${(emp.firstName?.charCodeAt(0) || 0) * 15}, 60%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.firstName} {emp.lastName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{emp.designation || 'No designation'}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                  {new Date(emp.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Announcements */}
        {isEnabled('announcements') && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Announcements</span>
              <a href="/announcements" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
            </div>
            {loading ? (
              <div style={{ padding: '20px' }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '8px' }} />)}</div>
            ) : !stats?.announcements?.length ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                No announcements. {isAdmin && <a href="/announcements" style={{ color: 'var(--accent)' }}>Post one →</a>}
              </div>
            ) : stats.announcements.map((ann: any, i: number) => (
              <div key={i} style={{ padding: '14px 20px', borderBottom: i < stats.announcements.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
                    background: ann.priority === 'high' ? 'var(--danger)' : ann.priority === 'medium' ? 'var(--warning)' : 'var(--accent)',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>{ann.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ann.content}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                    {new Date(ann.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customize Modal */}
      {showCustomize && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={() => setShowCustomize(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '100%', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Customize Dashboard</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Show or hide widgets</p>
              </div>
              <button onClick={() => setShowCustomize(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {widgets.map(widget => (
                <label key={widget.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{widget.label}</span>
                  <div style={{
                    width: '40px', height: '22px', borderRadius: '11px', position: 'relative', cursor: 'pointer',
                    background: widget.enabled ? 'var(--accent)' : 'var(--bg-input)', transition: 'background 0.2s',
                    border: '1px solid var(--border)',
                  }} onClick={() => saveWidgets(widgets.map(w => w.id === widget.id ? { ...w, enabled: !w.enabled } : w))}>
                    <div style={{
                      position: 'absolute', top: '2px', left: widget.enabled ? '19px' : '2px',
                      width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                </label>
              ))}
            </div>
            <button onClick={() => { saveWidgets(DEFAULT_WIDGETS); }} style={{ width: '100%', marginTop: '16px', padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
