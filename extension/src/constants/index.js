// ============================================================
// Extension Constants — Message types, config, PII patterns
// ============================================================

export const MESSAGES = {
  // Background ↔ Content
  EXTRACT_DOM: 'EXTRACT_DOM',
  DETECT_PII: 'DETECT_PII',
  REDACT_SCREENSHOT: 'REDACT_SCREENSHOT',
  EXECUTE_ACTION: 'EXECUTE_ACTION',
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',

  // Popup/Sidepanel ↔ Background
  START_AGENT: 'START_AGENT',
  STOP_AGENT: 'STOP_AGENT',
  GET_STATUS: 'GET_STATUS',
  STATUS_UPDATE: 'STATUS_UPDATE',
  METRICS_UPDATE: 'METRICS_UPDATE',

  // Content → Background
  CAPTURE_COMPLETE: 'CAPTURE_COMPLETE',
  ACTION_COMPLETE: 'ACTION_COMPLETE',

  // Background → UI (CLIP screen classification result)
  SCREEN_CLASSIFIED: 'SCREEN_CLASSIFIED',
};

export const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  API_VERSION: 'v1',
  CAPTURE_DELAY_MS: 2000,      // Delay between agent cycles
  SETTLE_DELAY_MS: 1500,       // Wait for page to settle after action
  MAX_RETRIES: 3,
  SCREENSHOT_QUALITY: 90,
  MAX_DOM_ELEMENTS: 100,       // Cap DOM elements sent to server
};

export const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}\b/g,
  phoneIntl: /\b\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
  aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  pan: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  dob: /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g,
  passport: /\b[A-Z]\d{7}\b/g,
  vehicleReg: /\b[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}\b/g,
};

export const SENSITIVITY_RULES = {
  inputTypes: ['password', 'email', 'tel', 'hidden'],
  autocomplete: [
    'cc-number', 'cc-exp', 'cc-csc', 'cc-name',
    'email', 'tel', 'tel-national',
    'name', 'given-name', 'family-name',
    'street-address', 'postal-code',
    'bday', 'sex', 'username',
    'new-password', 'current-password',
  ],
  fieldPatterns: [
    /passw(or)?d/i, /email/i, /phone|mobile|tel/i,
    /aadhaar|aadhar/i, /pan.?(card|number)/i,
    /ssn|social.?sec/i, /credit.?card|cc.?num/i,
    /cvv|cvc/i, /account.?(no|num)/i,
    /date.?of.?birth|dob/i, /address/i,
    /first.?name|last.?name|full.?name/i,
  ],
};

export const REDACTION_STRATEGIES = {
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
