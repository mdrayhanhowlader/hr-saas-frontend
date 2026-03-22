'use client';

interface Props {
  data: { email: string; tempPassword: string; employeeId: string; firstName: string };
  onClose: () => void;
}

export default function CredentialsModal({ data, onClose }: Props) {
  const loginUrl = typeof window !== 'undefined' ? window.location.origin + '/login' : '/login';

  const copyAll = () => {
    const text = `HR Portal Login\n\nURL: ${loginUrl}\nEmployee ID: ${data.employeeId}\nEmail: ${data.email}\nTemporary Password: ${data.tempPassword}\n\nPlease change your password after first login.`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const copyItem = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-xl)', padding: '32px', width: '100%', maxWidth: '440px', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>Employee Created!</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Share these credentials with <strong style={{ color: 'var(--text-primary)' }}>{data.firstName}</strong> securely.
          </p>
        </div>

        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Login Credentials</div>

          {[
            { label: 'Login URL', value: loginUrl },
            { label: 'Employee ID', value: data.employeeId, mono: true },
            { label: 'Email', value: data.email },
            { label: 'Temporary Password', value: data.tempPassword, mono: true, highlight: true },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>{item.label}</div>
                <div style={{
                  fontSize: item.highlight ? '17px' : '13px',
                  fontWeight: item.highlight ? '700' : '500',
                  color: item.highlight ? 'var(--accent)' : 'var(--text-primary)',
                  fontFamily: item.mono ? 'monospace' : 'inherit',
                  letterSpacing: item.highlight ? '1.5px' : 'normal',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {item.value}
                </div>
              </div>
              <button onClick={() => copyItem(item.value)} style={{
                padding: '5px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer',
                flexShrink: 0, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              >
                Copy
              </button>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(183,119,13,0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: 'var(--warning)', lineHeight: 1.5 }}>
          ⚠️ Ask <strong>{data.firstName}</strong> to change their password after first login via <strong>Settings → Account</strong>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={copyAll} style={{
            flex: 1, padding: '11px', background: 'var(--bg-input)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer', fontWeight: '500',
          }}>
            📋 Copy All
          </button>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', background: 'var(--accent)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
