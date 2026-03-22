export const themes = {
  dark: {
    '--bg-base': '#000000',
    '--bg-elevated': '#0A0A0A',
    '--bg-card': '#111111',
    '--bg-card-hover': '#161616',
    '--bg-input': '#0F0F0F',
    '--bg-overlay': 'rgba(0,0,0,0.85)',
    '--border': 'rgba(255,255,255,0.08)',
    '--border-medium': 'rgba(255,255,255,0.12)',
    '--border-strong': 'rgba(255,255,255,0.18)',
    '--text-primary': '#F5F5F7',
    '--text-secondary': '#86868B',
    '--text-tertiary': '#48484A',
    '--text-link': '#2997FF',
    '--accent': '#2997FF',
    '--accent-hover': '#0077ED',
    '--accent-glow': 'rgba(41,151,255,0.2)',
    '--accent-subtle': 'rgba(41,151,255,0.1)',
    '--success': '#32D74B',
    '--success-bg': 'rgba(50,215,75,0.1)',
    '--warning': '#FF9F0A',
    '--warning-bg': 'rgba(255,159,10,0.1)',
    '--danger': '#FF453A',
    '--danger-bg': 'rgba(255,69,58,0.1)',
    '--purple': '#BF5AF2',
    '--purple-bg': 'rgba(191,90,242,0.1)',
    '--teal': '#5AC8FA',
    '--teal-bg': 'rgba(90,200,250,0.1)',
  },
  light: {
    '--bg-base': '#F5F5F7',
    '--bg-elevated': '#FFFFFF',
    '--bg-card': '#FFFFFF',
    '--bg-card-hover': '#F5F5F7',
    '--bg-input': '#F5F5F7',
    '--bg-overlay': 'rgba(0,0,0,0.5)',
    '--border': 'rgba(0,0,0,0.08)',
    '--border-medium': 'rgba(0,0,0,0.12)',
    '--border-strong': 'rgba(0,0,0,0.2)',
    '--text-primary': '#1D1D1F',
    '--text-secondary': '#6E6E73',
    '--text-tertiary': '#AEAEB2',
    '--text-link': '#0066CC',
    '--accent': '#0066CC',
    '--accent-hover': '#0055AA',
    '--accent-glow': 'rgba(0,102,204,0.15)',
    '--accent-subtle': 'rgba(0,102,204,0.08)',
    '--success': '#1D8348',
    '--success-bg': 'rgba(29,131,72,0.08)',
    '--warning': '#B7770D',
    '--warning-bg': 'rgba(183,119,13,0.08)',
    '--danger': '#C0392B',
    '--danger-bg': 'rgba(192,57,43,0.08)',
    '--purple': '#7D3C98',
    '--purple-bg': 'rgba(125,60,152,0.08)',
    '--teal': '#117A8B',
    '--teal-bg': 'rgba(17,122,139,0.08)',
  }
};

export const applyTheme = (mode: 'dark' | 'light') => {
  const root = document.documentElement;
  const vars = themes[mode];
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  localStorage.setItem('theme', mode);
};

export const getTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light';
};
