'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayrollPage() {
  const { user } = useAuthStore();
  const isAdmin = ['HR_ADMIN', 'SUPER_ADMIN'].includes(user?.role || '');
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [myPayslips, setMyPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [showPayslip, setShowPayslip] = useState<any>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMethod, setBulkMethod] = useState('Bank Transfer');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [payRes, statsRes] = await Promise.all([
          api.get(`/payroll?month=${month}&year=${year}&limit=100`),
          api.get(`/payroll/stats?month=${month}&year=${year}`),
        ]);
        setPayrolls(payRes.data.data || []);
        setStats(statsRes.data.data);
      } else {
        const res = await api.get('/payroll/my');
        setMyPayslips(res.data.data || []);
      }
    } catch {}
    finally { setLoading(false); }
  }, [month, year, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    if (!confirm(`Generate payroll for ${MONTHS[month-1]} ${year}?\n\nThis will calculate salary for all active employees.`)) return;
    setGenerating(true);
    try {
      const res = await api.post('/payroll/generate', { month, year });
      alert(`✓ ${res.data.message}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    } finally { setGenerating(false); }
  };

  const handleStatusUpdate = async (id: string, status: string, paymentMethod?: string) => {
    try {
      await api.put(`/payroll/${id}/status`, { status, paymentMethod });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleBulkPay = async () => {
    if (selected.length === 0) return;
    try {
      await api.post('/payroll/bulk-status', { ids: selected, status: 'PAID', paymentMethod: bulkMethod });
      setSelected([]);
      setShowBulkModal(false);
      fetchData();
      alert(`✓ ${selected.length} payrolls marked as paid`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const unpaid = payrolls.filter(p => p.status !== 'PAID').map(p => p.id);
    setSelected(prev => prev.length === unpaid.length ? [] : unpaid);
  };

  const statusStyle: any = {
    DRAFT: { bg: 'rgba(100,100,100,0.1)', color: 'var(--text-secondary)', label: 'Draft' },
    PROCESSED: { bg: 'var(--accent-subtle)', color: 'var(--accent)', label: 'Processed' },
    APPROVED: { bg: 'var(--purple-bg)', color: 'var(--purple)', label: 'Approved' },
    PAID: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Paid' },
    CANCELLED: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'Cancelled' },
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '28px 32px', maxWidth: '900px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>My Payslips</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Your monthly salary details</p>
        </div>

        {loading ? (
          <div>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '72px', marginBottom: '8px' }} />)}</div>
        ) : myPayslips.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No payslips yet</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myPayslips.map((p: any) => (
              <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onClick={() => setShowPayslip(p)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)' }}>{MONTHS[p.month-1].slice(0,3).toUpperCase()}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px' }}>
                    {MONTHS[p.month-1]} {p.year}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {p.presentDays}/{p.workingDays} days · {p.overtimeHours > 0 ? `${p.overtimeHours}h OT` : 'No overtime'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--success)', marginBottom: '3px' }}>৳{Number(p.netSalary).toLocaleString()}</div>
                  <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500', background: statusStyle[p.status]?.bg, color: statusStyle[p.status]?.color }}>
                    {statusStyle[p.status]?.label}
                  </span>
                </div>
                <svg width="14" height="14" fill="none" stroke="var(--text-tertiary)" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
              </div>
            ))}
          </div>
        )}

        {showPayslip && <PayslipModal payroll={showPayslip} onClose={() => setShowPayslip(null)} companyName={user?.companyName} />}
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Payroll</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage employee salaries and payments</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {MONTHS.map((m, i) => <option key={i} value={i+1} style={{ background: '#111' }}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} style={{ background: '#111' }}>{y}</option>)}
          </select>
          {selected.length > 0 && (
            <button onClick={() => setShowBulkModal(true)} style={{ padding: '9px 14px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              ✓ Pay {selected.length} Selected
            </button>
          )}
          <button onClick={handleGenerate} disabled={generating} style={{ padding: '9px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', cursor: generating ? 'not-allowed' : 'pointer', boxShadow: 'var(--shadow-glow)' }}>
            {generating ? 'Generating...' : '⚡ Generate Payroll'}
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Employees', value: stats.totalEmployees, color: 'var(--accent)', sub: 'This month' },
            { label: 'Gross Payroll', value: `৳${Number(stats.totalGross).toLocaleString()}`, color: 'var(--text-primary)', sub: 'Before deductions' },
            { label: 'Net Payroll', value: `৳${Number(stats.totalNet).toLocaleString()}`, color: 'var(--success)', sub: 'After deductions' },
            { label: 'Pending', value: stats.pending, color: 'var(--warning)', sub: `${stats.paid} paid` },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: s.color, marginBottom: '3px' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '20px' }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '8px' }} />)}</div>
        ) : payrolls.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '6px' }}>No payroll for {MONTHS[month-1]} {year}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Click "Generate Payroll" to calculate salaries</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '11px 16px', textAlign: 'left' }}>
                  <input type="checkbox" checked={selected.length === payrolls.filter(p => p.status !== 'PAID').length && payrolls.filter(p => p.status !== 'PAID').length > 0}
                    onChange={toggleAll} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                </th>
                {['Employee', 'Basic', 'Allowances', 'Deductions', 'Overtime', 'Net Salary', 'Days', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '11px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    {p.status !== 'PAID' && (
                      <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)}
                        style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                    )}
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `hsl(${(p.employee?.firstName?.charCodeAt(0) || 0) * 15 % 360}, 55%, 40%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                        {p.employee?.firstName?.[0]}{p.employee?.lastName?.[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{p.employee?.firstName} {p.employee?.lastName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{p.employee?.department?.name || p.employee?.designation || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>৳{Number(p.basicSalary).toLocaleString()}</td>
                  <td style={{ padding: '12px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    ৳{(Number(p.houseAllowance) + Number(p.medicalAllowance) + Number(p.transportAllowance)).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 12px', fontSize: '13px', color: 'var(--danger)' }}>৳{Number(p.totalDeduction).toLocaleString()}</td>
                  <td style={{ padding: '12px 12px', fontSize: '13px', color: Number(p.overtimePay) > 0 ? 'var(--warning)' : 'var(--text-tertiary)' }}>
                    {Number(p.overtimePay) > 0 ? `৳${Number(p.overtimePay).toLocaleString()}` : '—'}
                  </td>
                  <td style={{ padding: '12px 12px', fontSize: '14px', fontWeight: '700', color: 'var(--success)', whiteSpace: 'nowrap' }}>৳{Number(p.netSalary).toLocaleString()}</td>
                  <td style={{ padding: '12px 12px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {p.presentDays}/{p.workingDays}d
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '500', background: statusStyle[p.status]?.bg, color: statusStyle[p.status]?.color, whiteSpace: 'nowrap' }}>
                      {statusStyle[p.status]?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setShowPayslip(p)} style={{ padding: '5px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        View
                      </button>
                      {p.status !== 'PAID' && (
                        <button onClick={() => handleStatusUpdate(p.id, 'PAID', 'Bank Transfer')} style={{ padding: '5px 8px', background: 'var(--success-bg)', border: '1px solid rgba(50,215,75,0.2)', borderRadius: '6px', color: 'var(--success)', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPayslip && <PayslipModal payroll={showPayslip} onClose={() => setShowPayslip(null)} companyName={user?.companyName} />}

      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', padding: '24px', width: '100%', maxWidth: '380px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Mark {selected.length} as Paid</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '7px' }}>Payment Method</label>
              <select value={bulkMethod} onChange={e => setBulkMethod(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                {['Bank Transfer', 'Cash', 'Mobile Banking (bKash)', 'Mobile Banking (Nagad)', 'Cheque'].map(m => <option key={m} value={m} style={{ background: '#111' }}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowBulkModal(false)} style={{ flex: 1, padding: '11px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleBulkPay} style={{ flex: 2, padding: '11px', background: 'var(--success)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                ✓ Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PayslipModal({ payroll: p, onClose, companyName }: any) {
  const handlePrint = () => {
    const printContent = document.getElementById('payslip-content');
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Payslip - ${p.employee?.firstName} ${p.employee?.lastName}</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 32px; color: #111; background: white; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #eee; }
        .company { font-size: 20px; font-weight: 700; }
        .title { font-size: 14px; color: #666; margin-top: 4px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; }
        .section { padding: 16px; background: #f8f8f8; border-radius: 8px; }
        .section h3 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #666; margin-bottom: 10px; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; border-bottom: 1px solid #eee; }
        .total { font-size: 18px; font-weight: 700; color: #22C55E; text-align: center; padding: 16px; background: #f0fdf4; border-radius: 8px; margin-top: 20px; }
        @media print { body { padding: 16px; } }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  const gross = Number(p.grossSalary);
  const net = Number(p.netSalary);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Payslip</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handlePrint} style={{ padding: '8px 14px', background: 'var(--accent-subtle)', border: '1px solid rgba(41,151,255,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              🖨 Print / Download PDF
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '22px' }}>×</button>
          </div>
        </div>

        <div id="payslip-content" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{companyName || 'Company'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Salary Slip</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{MONTHS[p.month-1]} {p.year}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Pay Period</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Employee Name', value: `${p.employee?.firstName} ${p.employee?.lastName}` },
              { label: 'Employee ID', value: p.employee?.employeeId },
              { label: 'Department', value: p.employee?.department?.name || '—' },
              { label: 'Designation', value: p.employee?.designation || '—' },
              { label: 'Working Days', value: `${p.presentDays} / ${p.workingDays}` },
              { label: 'Absent Days', value: p.absentDays || 0 },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Earnings</div>
              {[
                { label: 'Basic Salary', value: Number(p.basicSalary) },
                { label: 'House Allowance', value: Number(p.houseAllowance) },
                { label: 'Medical Allowance', value: Number(p.medicalAllowance) },
                { label: 'Transport Allowance', value: Number(p.transportAllowance) },
                { label: 'Other Allowance', value: Number(p.otherAllowance) },
                { label: 'Overtime Pay', value: Number(p.overtimePay) },
              ].filter(i => i.value > 0).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>৳{item.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: '13px', fontWeight: '700' }}>
                <span style={{ color: 'var(--text-primary)' }}>Gross Total</span>
                <span style={{ color: 'var(--success)' }}>৳{gross.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Deductions</div>
              {[
                { label: 'Income Tax', value: Number(p.taxDeduction) },
                { label: 'Provident Fund', value: Number(p.providentFund) },
                { label: 'Other', value: Number(p.otherDeduction) },
              ].filter(i => i.value > 0).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ color: 'var(--danger)', fontWeight: '500' }}>৳{item.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: '13px', fontWeight: '700' }}>
                <span style={{ color: 'var(--text-primary)' }}>Total Deductions</span>
                <span style={{ color: 'var(--danger)' }}>৳{Number(p.totalDeduction).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--success-bg)', border: '1px solid rgba(50,215,75,0.2)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Net Salary</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--success)', letterSpacing: '-0.5px' }}>৳{net.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {p.status === 'PAID' ? `✓ Paid via ${p.paymentMethod || 'Bank Transfer'}${p.paidAt ? ` on ${new Date(p.paidAt).toLocaleDateString()}` : ''}` : 'Payment Pending'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
