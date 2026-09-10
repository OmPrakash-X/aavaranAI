// ============================================================
// Redaction Engine — Canvas-based privacy redaction
// Applies blur, solid fill, pixelate, or char mask to PII regions
// ============================================================

import { REDACTION_STRATEGIES } from '../../constants/index.js';

export class RedactionEngine {
  /**
   * Redact all detected PII regions on a screenshot canvas
   * @param {HTMLCanvasElement} canvas - Screenshot canvas
   * @param {Array} detections - PII detections with bounding boxes
   * @returns {Object} { redactedCanvas, manifest }
   */
  redact(canvas, detections) {
    const ctx = canvas.getContext('2d');
    const manifest = [];

    for (const detection of detections) {
      const strategy = REDACTION_STRATEGIES[detection.type] || 'gaussian_blur';

      this.applyStrategy(ctx, canvas, detection.bbox, strategy);

      manifest.push({
        type: detection.type,
        bbox: detection.bbox,
        strategy,
        confidence: detection.confidence,
        detectedBy: detection.detectedBy,
      });
    }

    return { redactedCanvas: canvas, manifest };
  }

  /**
   * Apply a specific redaction strategy to a region
   */
  applyStrategy(ctx, canvas, bbox, strategy) {
    // Clamp bbox to canvas bounds
    const x = Math.max(0, bbox.x);
    const y = Math.max(0, bbox.y);
    const w = Math.min(bbox.width, canvas.width - x);
    const h = Math.min(bbox.height, canvas.height - y);

    if (w <= 0 || h <= 0) return;

    switch (strategy) {
      case 'solid_fill':
        this.solidFill(ctx, x, y, w, h);
        break;
      case 'gaussian_blur':
        this.gaussianBlur(ctx, canvas, x, y, w, h);
        break;
      case 'pixelate':
        this.pixelate(ctx, canvas, x, y, w, h);
        break;
      case 'char_mask':
        this.charMask(ctx, x, y, w, h);
        break;
      default:
        this.solidFill(ctx, x, y, w, h);
    }
  }

  /**
   * Solid black rectangle — for passwords, Aadhaar, PAN
   */
  solidFill(ctx, x, y, w, h) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, w, h);

    // Add a subtle "REDACTED" label
    ctx.fillStyle = '#333333';
    ctx.font = `${Math.min(10, h * 0.4)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('■■■■', x + w / 2, y + h / 2);
  }

  /**
   * Gaussian blur (simulated via iterative box blur) — for faces
   */
  gaussianBlur(ctx, canvas, x, y, w, h) {
    const iterations = 8; // More iterations = smoother blur
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');

    // Extract region
    tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    // Apply iterative downscale + upscale (fast box blur)
    const scale = 0.08; // Lower = more blur
    const sw = Math.max(1, Math.floor(w * scale));
    const sh = Math.max(1, Math.floor(h * scale));

    for (let i = 0; i < iterations; i++) {
      tempCtx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, sw, sh);
      tempCtx.drawImage(tempCanvas, 0, 0, sw, sh, 0, 0, w, h);
    }

    // Draw blurred region back
    ctx.drawImage(tempCanvas, 0, 0, w, h, x, y, w, h);
  }

  /**
   * Pixelate (mosaic effect) — for names, addresses
   */
  pixelate(ctx, canvas, x, y, w, h) {
    const pixelSize = Math.max(6, Math.min(w, h) * 0.1);

    // Extract region
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h);

    // Downscale
    const sw = Math.max(1, Math.floor(w / pixelSize));
    const sh = Math.max(1, Math.floor(h / pixelSize));

    ctx.imageSmoothingEnabled = false;
    tempCtx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, sw, sh);
    ctx.drawImage(tempCanvas, 0, 0, sw, sh, x, y, w, h);
    ctx.imageSmoothingEnabled = true;
  }

  /**
   * Character mask — for emails, phones (shows format but hides content)
   */
  charMask(ctx, x, y, w, h) {
    // Semi-transparent dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(x, y, w, h);

    // Draw mask pattern
    ctx.fillStyle = '#555555';
    ctx.font = `${Math.min(12, h * 0.6)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('●●●●●●●●', x + w / 2, y + h / 2);
  }

  /**
   * Convert a canvas to a base64 data URL
   */
  static canvasToBase64(canvas, format = 'image/png', quality = 0.9) {
    return canvas.toDataURL(format, quality);
  }
}
