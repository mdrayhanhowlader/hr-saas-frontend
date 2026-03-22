'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [dashRes, payRes, attRes, empRes, leaveRes] = await Promise.all([
          api.get('/dashboard'),
          api.get(`/payroll/stats?month=${month}&year=${year}`),
          api.get(`/attendance/stats`),
          api.get('/employees/stats'),
          api.get('/leaves'),
        ]);
        setData({
          dashboard: dashRes.data.data,
          payroll: payRes.data.data,
          attendance: attRes.data.data,
          employees: empRes.data.data,
          leaves: leaveRes.data.data,
        });
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, [month, year]);

  const exportCSV = (rows: any[], filename: string) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPayrollCSV = async () => {
    try {
      const res = await api.get(`/payroll?month=${month}&year=${year}&limit=200`);
      const rows = (res.data.data || []).map((p: any) => ({
        'Employee ID': p.employee?.employeeId,
        'Name': `${p.employee?.firstName} ${p.employee?.lastName}`,
        'Department': p.employee?.department?.name || '',
        'Basic Salary': p.basicSalary,
        'House Allowance': p.houseAllowance,
        'Medical Allowance': p.medicalAllowance,
        'Transport Allowance': p.transportAllowance,
        'Gross Salary': p.grossSalary,
        'Tax Deduction': p.taxDeduction,
        'Provident Fund': p.providentFund,
        'Total Deduction': p.totalDeduction,
        'Overtime Pay': p.overtimePay,
        'Net Salary': p.netSalary,
        'Working Days': p.workingDays,
        'Present Days': p.presentDays,
        'Absent Days': p.absentDays,
        'Status': p.status,
        'Payment Method': p.paymentMethod || '',
        'Paid At': p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '',
      }));
      exportCSV(rows, `payroll_${MONTHS[month-1]}_${year}`);
    } catch { alert('Failed to export'); }
  };

  const exportAttendanceCSV = async () => {
    try {
      const res = await api.get(`/attendance?month=${month}&year=${year}&limit=500`);
      const rows = (res.data.data || []).map((a: any) => ({
        'Employee': `${a.employee?.firstName} ${a.employee?.lastName}`,
        'Employee ID': a.employee?.employeeId,
        'Date': new Date(a.date).toLocaleDateString(),
        'Check In': a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '',
        'Check Out': a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '',
        'Work Hours': a.workHours || 0,
        'Status': a.status,
        'Source': a.source,
      }));
      exportCSV(rows, `attendance_${MONTHS[month-1]}_${year}`);
    } catch { alert('Failed to export'); }
  };

  const exportEmployeeCSV = async () => {
    try {
      const res = await api.get('/employees?limit=500');
      const rows = (res.data.data || []).map((e: any) => ({
        'Employee ID': e.employeeId,
        'First Name': e.firstName,
        'Last Name': e.lastName,
        'Email': e.email,
        'Phone': e.phone || '',
        'Department': e.department?.name || '',
        'Designation': e.designation || '',
        'Employment Type': e.employmentType,
        'Status': e.employmentStatus,
        'Joining Date': new Date(e.joiningDate).toLocaleDateString(),
        'Basic Salary': e.basicSalary,
        'Gender': e.gender || '',
        'Blood Group': e.bloodGroup || '',
      }));
      exportCSV(rows, `employees_${year}`);
    } catch { alert('Failed to export'); }
  };

  const StatCard = ({ label, value, sub, color = 'var(--text-primary)' }: any) => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', transition: 'border-color 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-medium)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
    >
      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color, marginBottom: '3px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{sub}</div>}
    </div>
  );

  const ExportCard = ({ title, desc, icon, onClick, color }: any) => (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.15s' }}
      onClick={onClick}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '3px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{desc}</div>
      </div>
      <div style={{ fontSize: '12px', fontWeight: '500', color, background: `${color}15`, padding: '5px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
        Export CSV
      </div>
    </div>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px', marginBottom: '4px' }}>Reports & Analytics</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Overview and data export</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {MONTHS.map((m, i) => <option key={i} value={i+1} style={{ background: '#111' }}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '9px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y} style={{ background: '#111' }}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: '90px' }} />)}
        </div>
      ) : data && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Employee Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <StatCard label="Total Employees" value={data.employees?.total || 0} sub="All time" color="var(--accent)" />
              <StatCard label="Active" value={data.employees?.active || 0} sub="Currently working" color="var(--success)" />
              <StatCard label="On Leave" value={data.employees?.onLeave || 0} sub="Right now" color="var(--warning)" />
              <StatCard label="Terminated" value={data.employees?.terminated || 0} sub="Total" color="var(--danger)" />
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Attendance — Today</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <StatCard label="Present" value={data.attendance?.presentToday || 0} color="var(--success)" />
              <StatCard label="Late" value={data.attendance?.lateToday || 0} color="var(--warning)" />
              <StatCard label="Absent" value={data.attendance?.absentToday || 0} color="var(--danger)" />
              <StatCard label="Not Marked" value={data.attendance?.notMarked || 0} color="var(--text-secondary)" />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Payroll — {MONTHS[month-1]} {year}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <StatCard label="Employees" value={data.payroll?.totalEmployees || 0} />
              <StatCard label="Gross Payroll" value={`৳${Number(data.payroll?.totalGross || 0).toLocaleString()}`} color="var(--text-primary)" />
              <StatCard label="Net Payroll" value={`৳${Number(data.payroll?.totalNet || 0).toLocaleString()}`} color="var(--success)" sub="After deductions" />
              <StatCard label="Pending" value={data.payroll?.pending || 0} color="var(--warning)" sub={`${data.payroll?.paid || 0} paid`} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Export Data</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ExportCard title="Payroll Report" desc={`Salary details for ${MONTHS[month-1]} ${year}`} icon="💰" onClick={exportPayrollCSV} color="var(--success)" />
              <ExportCard title="Attendance Report" desc={`Attendance records for ${MONTHS[month-1]} ${year}`} icon="📅" onClick={exportAttendanceCSV} color="var(--accent)" />
              <ExportCard title="Employee List" desc="Complete employee directory with all details" icon="👥" onClick={exportEmployeeCSV} color="var(--purple)" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
