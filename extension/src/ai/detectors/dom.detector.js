// ============================================================
// DOM Detector — Rule-based PII detection from DOM attributes
// Layer 1 of 4 — Free (0ms), high precision
// ============================================================

import { SENSITIVITY_RULES } from '../../constants/index.js';

export class DOMDetector {
  /**
   * Detect sensitive fields by analyzing DOM properties
   * Returns bounding boxes of sensitive elements
   */
  detect() {
    const detections = [];
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach((el) => {
      const sensitivity = this.classifyElement(el);
      if (!sensitivity) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Check if element has a visible value
      const hasValue = el.value && el.value.length > 0;

      detections.push({
        type: sensitivity,
        bbox: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        confidence: 0.95, // DOM-based detection is very reliable
        detectedBy: 'dom',
        rawText: hasValue ? '[REDACTED]' : null,
      });
    });

    return detections;
  }

  /**
   * Classify a form element's sensitivity type
   */
  classifyElement(el) {
    // Check input type
    const type = (el.type || '').toLowerCase();
    if (type === 'password') return 'password';
    if (type === 'email') return 'email';
    if (type === 'tel') return 'phone';

    // Check autocomplete attribute
    const autocomplete = (el.autocomplete || '').toLowerCase();
    if (autocomplete.includes('password') || autocomplete === 'new-password' || autocomplete === 'current-password') return 'password';
    if (autocomplete === 'email') return 'email';
    if (autocomplete === 'tel' || autocomplete === 'tel-national') return 'phone';
    if (autocomplete.startsWith('cc-')) return 'credit_card';
    if (autocomplete === 'bday') return 'dob';
    if (['name', 'given-name', 'family-name', 'username'].includes(autocomplete)) return 'name';
    if (['street-address', 'postal-code', 'address-line1', 'address-line2'].includes(autocomplete)) return 'address';

    // Check name, id, class against patterns
    const identifiers = [
      el.name || '',
      el.id || '',
      el.className || '',
      this.getLabelText(el) || '',
      el.placeholder || '',
    ].join(' ').toLowerCase();

    for (const pattern of SENSITIVITY_RULES.fieldPatterns) {
      if (pattern.test(identifiers)) {
        // Determine type from matched pattern
        if (/passw/i.test(identifiers)) return 'password';
        if (/email/i.test(identifiers)) return 'email';
        if (/phone|mobile|tel/i.test(identifiers)) return 'phone';
        if (/aadhaar|aadhar/i.test(identifiers)) return 'aadhaar';
        if (/pan/i.test(identifiers)) return 'pan';
        if (/credit|card|cc/i.test(identifiers)) return 'credit_card';
        if (/cvv|cvc/i.test(identifiers)) return 'credit_card';
        if (/account/i.test(identifiers)) return 'credit_card';
        if (/dob|birth/i.test(identifiers)) return 'dob';
        if (/address/i.test(identifiers)) return 'address';
        if (/name/i.test(identifiers)) return 'name';
        return 'unknown';
      }
    }

    return null; // Not sensitive
  }

  /**
   * Find associated label text for a form element
   */
  getLabelText(el) {
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) return label.textContent?.trim();
    }
    const parent = el.closest('label');
    if (parent) return parent.textContent?.trim();
    return null;
  }
}
