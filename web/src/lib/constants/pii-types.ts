// ============================================================
// Constants — PII type definitions, redaction strategy mapping
// ============================================================

import { PIIType, RedactionStrategy } from '@/lib/types/api.types';

/** Human-readable labels for each PII type */
export const PII_LABELS: Record<PIIType, string> = {
  face: 'Face',
  password: 'Password',
  email: 'Email Address',
  phone: 'Phone Number',
  aadhaar: 'Aadhaar Number',
  pan: 'PAN Card',
  credit_card: 'Credit Card',
  name: 'Person Name',
  address: 'Address',
  dob: 'Date of Birth',
  ip_address: 'IP Address',
  passport: 'Passport Number',
  vehicle_reg: 'Vehicle Registration',
  organization: 'Organization',
  location: 'Location',
  unknown: 'Unknown PII',
};

/** Color codes for PII types (used in dashboard UI) */
export const PII_COLORS: Record<PIIType, string> = {
  face: '#FF6B6B',
  password: '#EE5A24',
  email: '#0984E3',
  phone: '#6C5CE7',
  aadhaar: '#E17055',
  pan: '#FDCB6E',
  credit_card: '#E84393',
  name: '#00CEC9',
  address: '#55A3F5',
  dob: '#A29BFE',
  ip_address: '#FFA502',
  passport: '#FF6348',
  vehicle_reg: '#2ED573',
  organization: '#1E90FF',
  location: '#FF4757',
  unknown: '#747D8C',
};

/** Default redaction strategy for each PII type */
export const REDACTION_STRATEGY_MAP: Record<PIIType, RedactionStrategy> = {
  face: 'gaussian_blur',
  password: 'solid_fill',
  email: 'char_mask',
  phone: 'char_mask',
  aadhaar: 'solid_fill',
  pan: 'solid_fill',
  credit_card: 'solid_fill',
  name: 'pixelate',
  address: 'pixelate',
  dob: 'solid_fill',
  ip_address: 'char_mask',
  passport: 'solid_fill',
  vehicle_reg: 'char_mask',
  organization: 'pixelate',
  location: 'pixelate',
  unknown: 'gaussian_blur',
};
