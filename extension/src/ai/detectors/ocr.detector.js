// ============================================================
// OCR Detector — Tesseract.js text extraction + regex PII matching
// Layer 2 of 4 — ~200ms, catches text-rendered PII
// ============================================================

import { PII_PATTERNS } from '../../constants/index.js';

export class OCRDetector {
  constructor() {
    this.worker = null;
    this.isReady = false;
  }

  /**
   * Initialize Tesseract.js worker
   */
  async initialize() {
    if (this.isReady) return;

    try {
      // Dynamically import Tesseract.js
      const Tesseract = await import(chrome.runtime.getURL('lib/tesseract.min.js'));
      this.worker = await Tesseract.createWorker('eng', 1, {
        workerPath: chrome.runtime.getURL('lib/tesseract-worker.min.js'),
        langPath: chrome.runtime.getURL('assets/models/tesseract'),
        corePath: chrome.runtime.getURL('lib/tesseract-core-simd.wasm.js'),
      });
      this.isReady = true;
      console.log('[OCR] Tesseract worker initialized');
    } catch (err) {
      console.error('[OCR] Failed to initialize:', err);
    }
  }

  /**
   * Run OCR on screenshot, then regex-match for PII
   * @param {ImageData|HTMLCanvasElement|string} image - Screenshot to analyze
   * @returns {Array} PII detections with bounding boxes
   */
  async detect(image) {
    if (!this.isReady) {
      console.warn('[OCR] Not initialized, skipping');
      return [];
    }

    try {
      const result = await this.worker.recognize(image);
      const detections = [];

      // Process each word from OCR output
      for (const word of result.data.words) {
        const text = word.text.trim();
        if (text.length < 3) continue;

        const piiType = this.matchPII(text);
        if (piiType) {
          const bbox = word.bbox;
          detections.push({
            type: piiType,
            bbox: {
              x: bbox.x0,
              y: bbox.y0,
              width: bbox.x1 - bbox.x0,
              height: bbox.y1 - bbox.y0,
            },
            confidence: word.confidence / 100,
            detectedBy: 'ocr',
            rawText: text,
          });
        }
      }

      // Also check multi-word patterns by joining lines
      for (const line of result.data.lines) {
        const lineText = line.text.trim();
        const lineDetections = this.matchMultiWordPII(lineText, line.bbox);
        detections.push(...lineDetections);
      }

      console.log(`[OCR] Found ${detections.length} PII items in text`);
      return detections;
    } catch (err) {
      console.error('[OCR] Detection failed:', err);
      return [];
    }
  }

  /**
   * Match a single word/token against PII patterns
   */
  matchPII(text) {
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        // Map pattern name to PII type
        const typeMap = {
          email: 'email',
          phone: 'phone',
          phoneIntl: 'phone',
          aadhaar: 'aadhaar',
          pan: 'pan',
          creditCard: 'credit_card',
          ipAddress: 'ip_address',
          dob: 'dob',
          passport: 'passport',
          vehicleReg: 'vehicle_reg',
        };
        return typeMap[type] || 'unknown';
      }
    }
    return null;
  }

  /**
   * Match multi-word patterns (e.g., full credit card numbers spanning words)
   */
  matchMultiWordPII(lineText, lineBBox) {
    const detections = [];

    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(lineText)) !== null) {
        // Approximate bounding box for the matched region
        const charWidth = (lineBBox.x1 - lineBBox.x0) / lineText.length;
        const startX = lineBBox.x0 + match.index * charWidth;
        const matchWidth = match[0].length * charWidth;

        const typeMap = {
          email: 'email', phone: 'phone', phoneIntl: 'phone',
          aadhaar: 'aadhaar', pan: 'pan', creditCard: 'credit_card',
          ipAddress: 'ip_address', dob: 'dob', passport: 'passport',
          vehicleReg: 'vehicle_reg',
        };

        detections.push({
          type: typeMap[type] || 'unknown',
          bbox: {
            x: Math.round(startX),
            y: lineBBox.y0,
            width: Math.round(matchWidth),
            height: lineBBox.y1 - lineBBox.y0,
          },
          confidence: 0.85,
          detectedBy: 'ocr',
          rawText: match[0],
        });
      }
    }

    return detections;
  }

  /**
   * Cleanup worker
   */
  async dispose() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
}
