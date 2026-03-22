'use client';

import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showTime?: boolean;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export default function DatePicker({ value, onChange, placeholder = 'Select date', showTime = false, minDate, maxDate, required }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value);
    return new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [hours, setHours] = useState(value ? new Date(value).getHours().toString().padStart(2, '0') : '09');
  const [minutes, setMinutes] = useState(value ? new Date(value).getMinutes().toString().padStart(2, '0') : '00');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setSelectedDate(d);
      setViewDate(d);
      setHours(d.getHours().toString().padStart(2, '0'));
      setMinutes(d.getMinutes().toString().padStart(2, '0'));
    }
  }, [value]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleSelectDay = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(d);
    if (!showTime) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      onChange(iso);
      setOpen(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    const d = new Date(selectedDate);
    d.setHours(parseInt(hours), parseInt(minutes));
    const iso = showTime
      ? d.toISOString()
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onChange(iso);
    setOpen(false);
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const isDisabled = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (minDate && d < new Date(minDate)) return true;
    if (maxDate && d > new Date(maxDate)) return true;
    return false;
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === viewDate.getMonth() && today.getFullYear() === viewDate.getFullYear();
  };

  const displayValue = () => {
    if (!selectedDate) return '';
    if (showTime) {
      return `${selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${hours}:${minutes}`;
    }
    return selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Input */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 12px', background: 'var(--bg-input)',
          border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-sm)', cursor: 'pointer',
          transition: 'border-color 0.15s', userSelect: 'none',
        }}
      >
        <svg width="14" height="14" fill="none" stroke={open ? 'var(--accent)' : 'var(--text-tertiary)'} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.5"/>
          <path strokeWidth="1.5" strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        <span style={{ flex: 1, fontSize: '13px', color: displayValue() ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
          {displayValue() || placeholder}
        </span>
        {displayValue() && (
          <span onClick={e => { e.stopPropagation(); onChange(''); setSelectedDate(null); }}
            style={{ color: 'var(--text-tertiary)', fontSize: '16px', lineHeight: 1, cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--danger)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'}
          >×</span>
        )}
      </div>

      {/* Calendar dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
          background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
          width: showTime ? '300px' : '260px', overflow: 'hidden',
          animation: 'fadeIn 0.15s ease',
        }}>
          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', transition: 'all 0.15s', fontSize: '16px' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >‹</button>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select value={viewDate.getMonth()} onChange={e => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', padding: '3px 6px', cursor: 'pointer', outline: 'none' }}>
                {MONTHS.map((m, i) => <option key={m} value={i} style={{ background: '#111' }}>{m}</option>)}
              </select>
              <select value={viewDate.getFullYear()} onChange={e => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))}
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', padding: '3px 6px', cursor: 'pointer', outline: 'none' }}>
                {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 25 + i).map(y => <option key={y} value={y} style={{ background: '#111' }}>{y}</option>)}
              </select>
            </div>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', transition: 'all 0.15s', fontSize: '16px' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
            >›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 12px 4px' }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '600', color: 'var(--text-tertiary)', letterSpacing: '0.05em', padding: '2px 0' }}>{d}</div>)}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 12px 12px', gap: '1px' }}>
            {cells.map((day, i) => (
              <div key={i} onClick={() => day && !isDisabled(day) && handleSelectDay(day)} style={{
                textAlign: 'center', padding: '7px 4px', borderRadius: '7px', fontSize: '13px',
                cursor: day && !isDisabled(day) ? 'pointer' : 'default',
                background: isSelected(day!) ? 'var(--accent)' : 'transparent',
                color: !day ? 'transparent' : isSelected(day) ? 'white' : isDisabled(day) ? 'var(--text-tertiary)' : isToday(day) ? 'var(--accent)' : 'var(--text-primary)',
                fontWeight: isSelected(day!) || isToday(day!) ? '600' : '400',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { if (day && !isDisabled(day) && !isSelected(day)) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { if (!isSelected(day!)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >{day || ''}</div>
            ))}
          </div>

          {/* Time picker */}
          {showTime && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Time</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <input type="number" min="0" max="23" value={hours} onChange={e => setHours(e.target.value.padStart(2,'0'))}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600', textAlign: 'center', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '3px' }}>HH</div>
                </div>
                <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '14px' }}>:</span>
                <div style={{ flex: 1 }}>
                  <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value.padStart(2,'0'))}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600', textAlign: 'center', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '3px' }}>MM</div>
                </div>
                {/* Quick time buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[['09','00'],['13','00'],['18','00']].map(([h,m]) => (
                    <button key={h} onClick={() => { setHours(h); setMinutes(m); }} style={{ padding: '3px 7px', background: hours === h ? 'var(--accent-subtle)' : 'var(--bg-elevated)', border: `1px solid ${hours === h ? 'rgba(41,151,255,0.3)' : 'var(--border)'}`, borderRadius: '5px', color: hours === h ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {h}:{m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Confirm button for time picker */}
          {showTime && (
            <div style={{ padding: '0 16px 14px', display: 'flex', gap: '8px' }}>
              <button onClick={() => setOpen(false)} style={{ flex: 1, padding: '9px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleConfirm} disabled={!selectedDate} style={{ flex: 2, padding: '9px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: selectedDate ? 'pointer' : 'not-allowed', opacity: selectedDate ? 1 : 0.5 }}>Confirm</button>
            </div>
          )}

          {/* Today button */}
          {!showTime && (
            <div style={{ padding: '0 12px 12px' }}>
              <button onClick={() => { const t = new Date(); setViewDate(t); handleSelectDay(t.getDate()); }}
                style={{ width: '100%', padding: '7px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              >Today</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
