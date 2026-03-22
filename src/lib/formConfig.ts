const DEFAULT_CONFIG = {
  nid: { required: false, enabled: true, label: 'National ID (NID)' },
  nidPhoto: { required: false, enabled: true, label: 'NID Photo' },
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

export type FieldConfig = { required: boolean; enabled: boolean; label: string };
export type FormConfig = Record<string, FieldConfig>;

export const getFormConfig = (tenantId?: string): FormConfig => {
  if (typeof window === 'undefined' || !tenantId) return DEFAULT_CONFIG;
  try {
    const saved = localStorage.getItem(`formConfig_${tenantId}`);
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_CONFIG;
};

export const isFieldEnabled = (config: FormConfig, key: string): boolean =>
  config[key]?.enabled !== false;

export const isFieldRequired = (config: FormConfig, key: string): boolean =>
  config[key]?.required === true;
