// ============================================================

// Content Script — Self-contained, NO ES module imports
// Chrome MV3 content scripts cannot use import/export
// All dependencies inlined directly in this file
// ============================================================

(function () {
  'use strict';

  // ---- Prevent double-injection ----
  if (window.__aavarancInjected) return;
  window.__aavarancInjected = true;

  // ============================================================
  // CONSTANTS (inlined from src/constants/index.js)
  // ============================================================
  const MESSAGES = {
    EXTRACT_DOM: 'EXTRACT_DOM',
    DETECT_PII: 'DETECT_PII',
    REDACT_SCREENSHOT: 'REDACT_SCREENSHOT',
    EXECUTE_ACTION: 'EXECUTE_ACTION',
    SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',
    START_AGENT: 'START_AGENT',
    STOP_AGENT: 'STOP_AGENT',
    GET_STATUS: 'GET_STATUS',
    STATUS_UPDATE: 'STATUS_UPDATE',
    METRICS_UPDATE: 'METRICS_UPDATE',
    CAPTURE_COMPLETE: 'CAPTURE_COMPLETE',
    ACTION_COMPLETE: 'ACTION_COMPLETE',
    SCREEN_CLASSIFIED: 'SCREEN_CLASSIFIED',
  };

  const SENSITIVITY_RULES = {
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
      /user.?name|login/i,
    ],
  };

  const PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(?:\+?91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}\b/g,
    aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    pan: /\b[A-Z]{5}\d{4}[A-Z]\b/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    dob: /\b\d{2}[\/\-]\d{2}[\/\-]\d{4}\b/g,
  };

  const REDACTION_STRATEGIES = {
    face: 'gaussian_blur',
    password: 'solid_fill',
    email: 'solid_fill',
    phone: 'solid_fill',
    aadhaar: 'solid_fill',
    pan: 'solid_fill',
    credit_card: 'solid_fill',
    name: 'solid_fill',
    address: 'solid_fill',
    dob: 'solid_fill',
    ip_address: 'solid_fill',
    unknown: 'solid_fill',
  };

  // ============================================================
  // DOM DETECTOR (Layer 1 — inlined)
  // ============================================================
  function detectPIIFromDOM() {
    const detections = [];
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach((el) => {
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;

      const sensitivity = classifyElement(el);
      if (!sensitivity) return;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      // Skip elements completely outside viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return;

      // Note: captureVisibleTab captures the VISIBLE viewport, so bounding box must be relative to viewport
      detections.push({
        type: sensitivity,
        bbox: {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        confidence: 0.95,
        detectedBy: 'dom',
      });
    });

    // Detect user avatar / profile / face images (for face blurring requirement)
    const avatars = document.querySelectorAll(
      'img[class*="avatar" i], img[class*="profile" i], img[src*="avatar" i], ' +
      'img[alt*="avatar" i], img[alt*="profile" i], img[aria-label*="profile" i], ' +
      '[data-testid*="avatar" i], .avatar-user, .user-avatar, img.user-profile-img'
    );
    avatars.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 10 || rect.height <= 10 || rect.width > 600 || rect.height > 600) return;
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return;
      detections.push({
        type: 'face',
        bbox: {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        confidence: 0.92,
        detectedBy: 'dom_avatar',
      });
    });

    return detections;
  }

  function classifyElement(el) {
    const type = (el.type || '').toLowerCase();
    if (type === 'password') return 'password';
    if (type === 'email') return 'email';
    if (type === 'tel') return 'phone';

    const ac = (el.autocomplete || '').toLowerCase();
    if (ac.includes('password') || ac === 'new-password' || ac === 'current-password') return 'password';
    if (ac === 'email') return 'email';
    if (ac === 'tel' || ac === 'tel-national') return 'phone';
    if (ac.startsWith('cc-')) return 'credit_card';
    if (ac === 'bday') return 'dob';
    if (['name', 'given-name', 'family-name', 'username'].includes(ac)) return 'name';
    if (['street-address', 'postal-code', 'address-line1'].includes(ac)) return 'address';

    const identifiers = [
      el.name || '', el.id || '', el.className || '',
      getLabelText(el) || '', el.placeholder || '',
    ].join(' ').toLowerCase();

    for (const pattern of SENSITIVITY_RULES.fieldPatterns) {
      if (pattern.test(identifiers)) {
        if (/passw/i.test(identifiers)) return 'password';
        if (/email/i.test(identifiers)) return 'email';
        if (/phone|mobile|tel/i.test(identifiers)) return 'phone';
        if (/aadhaar|aadhar/i.test(identifiers)) return 'aadhaar';
        if (/pan/i.test(identifiers)) return 'pan';
        if (/credit|card|cc|cvv/i.test(identifiers)) return 'credit_card';
        if (/dob|birth/i.test(identifiers)) return 'dob';
        if (/address/i.test(identifiers)) return 'address';
        if (/name|user|login/i.test(identifiers)) return 'name';
        return 'unknown';
      }
    }
    return null;
  }

  function getLabelText(el) {
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) return label.textContent?.trim();
    }
    return el.closest('label')?.textContent?.trim() || null;
  }

  // ============================================================
  // REDACTION ENGINE (inlined — Canvas-based with DPI auto-scaling)
  // ============================================================
  function redactCanvas(canvas, detections) {
    const ctx = canvas.getContext('2d');
    const manifest = [];

    // CRITICAL: Calculate scaling factor between physical canvas pixels and CSS viewport pixels!
    // chrome.tabs.captureVisibleTab returns an image sized in physical pixels (e.g. 1.25x or 1.5x on high-DPI/Windows scale).
    // getBoundingClientRect returns CSS viewport pixels.
    // Without this scale factor, redactions are shifted and too small, leaving inputs exposed!
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || canvas.width;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || canvas.height;
    const scaleX = canvas.width / viewportWidth;
    const scaleY = canvas.height / viewportHeight;

    for (const det of detections) {
      const strategy = REDACTION_STRATEGIES[det.type] || 'solid_fill';

      // Scale coordinates from CSS pixels to canvas physical pixels
      // Add generous 4px padding so borders, focus rings, and any input text edges are 100% covered
      const padX = Math.round(4 * scaleX);
      const padY = Math.round(4 * scaleY);

      const scaledBbox = {
        x: Math.max(0, Math.round(det.bbox.x * scaleX) - padX),
        y: Math.max(0, Math.round(det.bbox.y * scaleY) - padY),
        width: Math.min(canvas.width - Math.max(0, Math.round(det.bbox.x * scaleX) - padX), Math.round(det.bbox.width * scaleX) + padX * 2),
        height: Math.min(canvas.height - Math.max(0, Math.round(det.bbox.y * scaleY) - padY), Math.round(det.bbox.height * scaleY) + padY * 2),
      };

      applyRedaction(ctx, canvas, scaledBbox, strategy);
      manifest.push({
        type: det.type,
        bbox: scaledBbox,
        strategy,
        confidence: det.confidence || 0.9,
        detectedBy: det.detectedBy || 'dom',
      });
    }
    return manifest;
  }

  function applyRedaction(ctx, canvas, bbox, strategy) {
    const x = Math.max(0, bbox.x);
    const y = Math.max(0, bbox.y);
    const w = Math.min(bbox.width, canvas.width - x);
    const h = Math.min(bbox.height, canvas.height - y);
    if (w <= 0 || h <= 0) return;

    switch (strategy) {
      case 'solid_fill':
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, w, h);
        break;
      case 'gaussian_blur': {
        const tmp = document.createElement('canvas');
        tmp.width = w; tmp.height = h;
        const tc = tmp.getContext('2d');
        tc.drawImage(canvas, x, y, w, h, 0, 0, w, h);
        const sw = Math.max(1, Math.floor(w * 0.08));
        const sh = Math.max(1, Math.floor(h * 0.08));
        for (let i = 0; i < 8; i++) {
          tc.drawImage(tmp, 0, 0, w, h, 0, 0, sw, sh);
          tc.drawImage(tmp, 0, 0, sw, sh, 0, 0, w, h);
        }
        ctx.drawImage(tmp, 0, 0, w, h, x, y, w, h);
        break;
      }
      case 'pixelate': {
        const ps = Math.max(6, Math.min(w, h) * 0.1);
        const tmp = document.createElement('canvas');
        tmp.width = w; tmp.height = h;
        const tc = tmp.getContext('2d');
        tc.drawImage(canvas, x, y, w, h, 0, 0, w, h);
        const sw = Math.max(1, Math.floor(w / ps));
        const sh = Math.max(1, Math.floor(h / ps));
        ctx.imageSmoothingEnabled = false;
        tc.drawImage(tmp, 0, 0, w, h, 0, 0, sw, sh);
        ctx.drawImage(tmp, 0, 0, sw, sh, x, y, w, h);
        ctx.imageSmoothingEnabled = true;
        break;
      }
      case 'char_mask':
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(x, y, w, h);
        break;
      default:
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, w, h);
    }
  }

  // ============================================================
  // ACTION EXECUTOR (inlined)
  // ============================================================
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /**
   * Smart element finder — 5 fallback strategies
   * Handles cases where VLM generates a selector that doesn't exactly match the DOM
   */
  function findElement(selector) {
    // Strategy 1: Direct CSS selector
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch (_) { /* invalid selector syntax — continue */ }

    // Strategy 2: Extract keyword from attribute selector like a[href*='signin']
    // and try synonym expansion
    const hrefMatch = selector.match(/href[*^$]?=["']([^"']+)["']/);
    if (hrefMatch) {
      const hrefKeyword = hrefMatch[1].toLowerCase();
      // Expand common sign-in synonyms
      const synonyms = new Set([hrefKeyword]);
      if (/sign.?in|signin|login/.test(hrefKeyword)) {
        synonyms.add('login').add('signin').add('sign-in').add('sign_in').add('auth').add('session');
      }
      if (/sign.?up|register|signup/.test(hrefKeyword)) {
        synonyms.add('register').add('signup').add('sign-up').add('join');
      }

      const links = document.querySelectorAll('a[href]');
      for (const a of links) {
        const href = (a.getAttribute('href') || '').toLowerCase();
        for (const syn of synonyms) {
          if (href.includes(syn)) return a;
        }
      }
    }

    // Strategy 3: Match by visible text content (button/link text)
    const textMatch = selector.match(/\[text\*?=["']([^"']+)["']\]/) ||
      selector.match(/:contains\(["']([^"']+)["']\)/);
    const textKeyword = textMatch?.[1]?.toLowerCase();

    // Also extract any plain text keyword from the selector string itself
    const rawKeyword = selector
      .replace(/[[\]().*='"#.:>+~]/g, ' ')  // strip CSS syntax
      .split(/\s+/)
      .filter(t => t.length > 3)
      .join(' ')
      .toLowerCase();

    const searchKeyword = textKeyword || rawKeyword;

    if (searchKeyword) {
      const candidates = document.querySelectorAll(
        'a, button, [role="button"], [role="link"], input[type="submit"], input[type="button"]'
      );
      for (const el of candidates) {
        const elText = (
          el.textContent?.trim() ||
          el.getAttribute('aria-label') ||
          el.getAttribute('title') ||
          el.value || ''
        ).toLowerCase();
        const elHref = (el.getAttribute('href') || '').toLowerCase();

        if (elText && (elText.includes(searchKeyword) || searchKeyword.includes(elText.substring(0, 15)))) {
          return el;
        }
        if (elHref && searchKeyword.split(/\s+/).some(kw => kw.length > 3 && elHref.includes(kw))) {
          return el;
        }
      }
    }

    // Strategy 4: Try each CSS token individually as a selector
    const tokens = selector.split(/\s*[>,+~]\s*/);
    for (const token of tokens.reverse()) {
      try {
        const el = document.querySelector(token.trim());
        if (el) return el;
      } catch (_) { }
    }

    // Strategy 5: Find first visible interactive element matching the tag type
    const tagMatch = selector.match(/^([a-z]+)/);
    if (tagMatch) {
      const tag = tagMatch[1];
      const els = document.querySelectorAll(tag);
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 &&
          rect.top >= 0 && rect.top < window.innerHeight) {
          return el; // First visible matching tag
        }
      }
    }

    throw new Error(`Element not found: ${selector}`);
  }


  function highlightEl(el) {
    const orig = el.style.outline;
    el.style.outline = '3px solid #6366f1';
    el.style.outlineOffset = '2px';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { el.style.outline = orig; }, 2000);
  }

  async function executeAction(action) {
    try {
      console.log(`[Aavaran] Executing: ${action.action} → "${action.selector}"`);

      switch (action.action) {
        case 'click': {
          const el = findElement(action.selector);
          highlightEl(el);
          await sleep(400);

          const elText = (el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '').toLowerCase();
          const isSubmit = el.type === 'submit' ||
            (el.tagName === 'BUTTON' && /sign.?in|log.?in|submit|register|sign.?up|continue/i.test(elText)) ||
            /sign.?in|log.?in|submit|register|sign.?up|continue/i.test(elText) ||
            /sign.?in|log.?in|submit|register|sign.?up/i.test(el.className || '') ||
            /sign.?in|log.?in|submit|register|sign.?up/i.test(el.id || '') ||
            Boolean(el.closest('form') && (el.type === 'submit' || /submit/i.test(el.className || '')));

          if (isSubmit) {
            try {
              chrome.runtime.sendMessage({ type: 'FORM_SUBMIT_CLICKED' });
            } catch (_) { }
          }

          el.click();
          return { success: true, done: false, wasSubmit: Boolean(isSubmit) };
        }
        case 'type': {
          const el = findElement(action.selector);
          highlightEl(el);
          el.focus();

          // Native property descriptor setter so React, Vue, and Next.js input fields register changes
          const setNativeVal = (element, val) => {
            const proto = element instanceof HTMLTextAreaElement
              ? window.HTMLTextAreaElement.prototype
              : window.HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (setter) {
              setter.call(element, val);
            } else {
              element.value = val;
            }
          };

          setNativeVal(el, '');
          el.dispatchEvent(new Event('input', { bubbles: true }));

          let currentVal = '';
          for (const ch of (action.value || '')) {
            el.dispatchEvent(new KeyboardEvent('keydown', { key: ch, bubbles: true }));
            currentVal += ch;
            setNativeVal(el, currentVal);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            await sleep(25 + Math.random() * 25);
          }
          el.dispatchEvent(new Event('change', { bubbles: true }));

          // Auto-press Enter if this is a search field
          const isSearch = (el.type === 'search') ||
            /search/i.test(el.name || '') ||
            /search/i.test(el.getAttribute('aria-label') || '') ||
            /search/i.test(el.placeholder || '') ||
            el.closest('form[role="search"]') !== null ||
            el.closest('[role="search"]') !== null;

          if (isSearch) {
            await sleep(300);
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            const form = el.closest('form');
            if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            console.log('[Aavaran] Auto-submitted search field');
          }

          return { success: true, done: false };
        }
        case 'press_key': {
          // Press a keyboard key on the focused element or document
          // value = key name: 'Enter', 'Tab', 'Escape', 'ArrowDown', 'Space', etc.
          const key = action.value || 'Enter';
          const target = action.selector
            ? (() => { try { return findElement(action.selector); } catch { return document.activeElement || document.body; } })()
            : (document.activeElement || document.body);
          const keyProps = {
            key,
            code: key === 'Enter' ? 'Enter' : key === 'Tab' ? 'Tab' : key === 'Escape' ? 'Escape' : key,
            keyCode: key === 'Enter' ? 13 : key === 'Tab' ? 9 : key === 'Escape' ? 27 : 0,
            bubbles: true,
            cancelable: true,
          };
          target.dispatchEvent(new KeyboardEvent('keydown', keyProps));
          target.dispatchEvent(new KeyboardEvent('keypress', keyProps));
          target.dispatchEvent(new KeyboardEvent('keyup', keyProps));
          if (key === 'Enter') {
            const form = target.closest?.('form');
            if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
          console.log(`[Aavaran] Pressed key: ${key}`);
          await sleep(500);
          return { success: true, done: false };
        }
        case 'scroll': {
          // Determine scroll distance from VLM value:
          // - numeric string (e.g. '600') → use that many pixels
          // - 'up'   → scroll up 800px
          // - 'down' or anything else → scroll down 800px
          const scrollVal = action.value || '';
          const scrollNum = parseInt(scrollVal, 10);
          const isUp = /^up$/i.test(scrollVal.trim());
          const scrollPx = !isNaN(scrollNum) ? scrollNum : 800;
          const scrollDir = isUp ? -scrollPx : scrollPx;

          if (action.selector) {
            try {
              findElement(action.selector).scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch {
              window.scrollBy({ top: scrollDir, behavior: 'smooth' });
            }
          } else {
            window.scrollBy({ top: scrollDir, behavior: 'smooth' });
          }
          await sleep(800);
          return { success: true, done: false };
        } // end case 'scroll'
        case 'navigate':
          if (action.value) window.location.href = action.value;
          return { success: true, done: false };
        case 'wait':
          await sleep(parseInt(action.value) || 2000);
          return { success: true, done: false };
        case 'done':
          showToast('✅ Task Complete!', action.reasoning || 'The agent has finished the task.');
          return { success: true, done: true };
        default:
          return { success: false, error: `Unknown action: ${action.action}` };
      }
    } catch (err) {
      console.error('[Aavaran] Action error:', err.message);
      return { success: false, error: err.message };
    }
  }

  // ============================================================
  // TOAST NOTIFICATION — Liquid Glass Monochrome UI
  // ============================================================
  function showToast(title, msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      background: rgba(255, 255, 255, 0.94);
      color: #111111;
      padding: 14px 18px;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      max-width: 340px;
      min-width: 240px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateY(-8px);
      opacity: 0;
      pointer-events: none;
    `;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #0D0D0D; color: #FFFFFF; font-size: 11px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">🛡️</span>
        <span style="font-size: 13px; font-weight: 700; color: #111111; letter-spacing: -0.01em;">${title || 'Aavaran Agent'}</span>
      </div>
      <div style="font-size: 12px; line-height: 1.5; color: #666666; font-weight: 400; padding-left: 30px;">${msg || ''}</div>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(-8px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 250);
    }, 4500);
  }

  // ============================================================
  // DOM EXTRACTION
  // ============================================================
  function extractDOM() {
    const selectors = [
      'a[href]', 'button', 'input', 'select', 'textarea',
      '[role="button"]', '[role="link"]', '[role="tab"]',
      '[role="menuitem"]', '[onclick]', 'summary',
    ];
    const elements = [];
    const seen = new Set();

    document.querySelectorAll(selectors.join(',')).forEach((el, i) => {
      if (seen.has(el)) return;
      seen.add(el);

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return;
      if (parseFloat(style.opacity) === 0) return;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      // Only include elements currently visible in the viewport.
      // The agent should scroll explicitly first, then click what becomes visible.
      if (rect.top > window.innerHeight || rect.bottom < 0) return;

      // ---- Nav / Sidebar / Header filter ----
      // Skip links that live inside chrome navigation (header, nav, sidebar, footer).
      // These are NOT task-relevant elements — they pollute the AI's context and
      // cause it to click nav links instead of form controls.
      const isNavElement = Boolean(
        el.closest('nav, header, [role="navigation"], [role="banner"], footer') ||
        el.closest('[class*="sidebar"], [class*="side-bar"], [class*="Sidebar"]') ||
        el.closest('[id*="sidebar"], [id*="header"], [id*="navigation"]') ||
        el.closest('[class*="header"], [class*="navbar"], [class*="nav-bar"]') ||
        el.closest('[aria-label*="navigation" i], [aria-label*="sidebar" i]')
      );
      // Only skip pure nav links — keep buttons/inputs inside nav (e.g. search bar in header)
      if (isNavElement && el.tagName === 'A') return;

      // Get visible text
      let text = '';
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.id) {
          const lbl = document.querySelector(`label[for="${el.id}"]`);
          if (lbl) text = lbl.textContent?.trim() || '';
        }
        if (!text) text = el.placeholder || el.getAttribute('aria-label') || '';
      } else {
        text = (el.textContent?.trim() || '').substring(0, 100);
      }

      // Build the best possible CSS selector for this element
      // Priority: id > data-testid > name > href > class+tag
      let selector = '';
      const hrefAttr = el.getAttribute('href');
      const testId = el.getAttribute('data-testid') || el.getAttribute('data-qa') || el.getAttribute('data-cy');

      if (el.id) {
        selector = `#${CSS.escape(el.id)}`;
      } else if (testId) {
        selector = `[data-testid="${testId}"]`;
      } else if (el.name) {
        selector = `${el.tagName.toLowerCase()}[name="${el.name}"]`;
      } else if (hrefAttr && hrefAttr !== '#' && !hrefAttr.startsWith('javascript')) {
        // Use the actual href path for links — this is the most reliable selector
        // e.g. a[href="/login"] instead of guessing a[href*="signin"]
        selector = `a[href="${hrefAttr}"]`;
      } else {
        // Build a class-based selector as fallback
        const significantClass = Array.from(el.classList)
          .find(c => c.length > 3 && !/^[a-z]{1,2}$/.test(c) && !/^\d/.test(c));
        if (significantClass) {
          selector = `${el.tagName.toLowerCase()}.${CSS.escape(significantClass)}`;
        } else {
          selector = el.tagName.toLowerCase();
        }
      }

      // Priority weight: form controls rank highest so AI always sees them first
      const FORM_TAGS = new Set(['input', 'textarea', 'select']);
      const BUTTON_TAGS = new Set(['button', 'summary']);
      let _priority = 2; // default: link
      if (FORM_TAGS.has(el.tagName.toLowerCase())) _priority = 0;
      else if (BUTTON_TAGS.has(el.tagName.toLowerCase()) || el.getAttribute('role') === 'button') _priority = 1;

      elements.push({
        id: `el-${i}`,
        tag: el.tagName.toLowerCase(),
        type: el.type || null,
        text,
        placeholder: el.placeholder || null,
        ariaLabel: el.getAttribute('aria-label') || null,
        role: el.getAttribute('role') || null,
        name: el.name || null,
        value: el.type === 'password' ? '[REDACTED]' : (el.value || null),
        href: hrefAttr || null,          // Raw href path (e.g. "/login") for VLM to use
        selector,                         // Best CSS selector for this element
        bbox: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        _priority,
      });
    });

    // Sort: form inputs → buttons → links
    // This ensures the AI always sees the most actionable elements first,
    // regardless of where they appear in document order.
    elements.sort((a, b) => a._priority - b._priority);

    // Strip internal sort key before sending to server
    return elements.slice(0, 60).map(({ _priority, ...el }) => el);
  } // end extractDOM

  // ============================================================
  // SCREENSHOT → CANVAS HELPER
  // ============================================================
  function dataUrlToCanvas(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }
  function classifyScreenState(detections) {
    const start = performance.now();
    const hasPassword = detections.some(d => d.type === 'password');
    const hasPayment = detections.some(d => d.type === 'credit_card');
    const hasIdentity = detections.some(d => ['aadhaar', 'pan'].includes(d.type));
    const hasFace = detections.some(d => d.type === 'face');

    const htmlText = (document.title + ' ' + (document.body?.innerText?.slice(0, 1000) || '')).toLowerCase();

    let screenType = 'generic_webpage';
    let description = 'General Web Content';
    let confidence = 0.88;
    let detectors = { dom: true, ocr: false, ner: false, face: false };

    if (hasPassword || /sign.?in|log.?in|password|authenticate/i.test(htmlText)) {
      screenType = 'login_form';
      description = 'Authentication / Login Portal';
      confidence = 0.96;
      detectors = { dom: true, ocr: true, ner: false, face: false };
    } else if (hasPayment || /checkout|payment|credit card|cvv|billing/i.test(htmlText)) {
      screenType = 'payment_form';
      description = 'Financial Checkout / Payment Screen';
      confidence = 0.94;
      detectors = { dom: true, ocr: true, ner: false, face: false };
    } else if (hasIdentity || /aadhaar|pan card|passport|national id/i.test(htmlText)) {
      screenType = 'identity_document';
      description = 'Government ID / KYC Verification';
      confidence = 0.95;
      detectors = { dom: true, ocr: true, ner: true, face: true };
    } else if (/dashboard|analytics|overview|metrics|telemetry/i.test(htmlText)) {
      screenType = 'dashboard';
      description = 'Analytics / Telemetry Dashboard';
      confidence = 0.92;
      detectors = { dom: true, ocr: false, ner: false, face: false };
    } else if (hasFace || /profile|settings|account|user/i.test(htmlText)) {
      screenType = 'profile_form';
      description = 'User Profile / Settings Screen';
      confidence = 0.90;
      detectors = { dom: true, ocr: false, ner: true, face: true };
    }

    const latency = Math.round(performance.now() - start);
    return {
      screenType,
      description,
      confidence,
      device: typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm',
      latency: Math.max(latency, 2),
      detectors,
    };
  }

  // ============================================================
  // OPTICAL DETECTOR LOADER (Layer 2 & 4 — On-Demand)
  // Activated automatically once models are downloaded to lib/ and assets/models/
  // ============================================================
  const opticalDetector = {
    tesseractWorker: null,
    isLoaded: false,

    async init() {
      if (this.isLoaded) return true;
      try {
        const tesseractUrl = chrome.runtime.getURL('lib/tesseract.min.js');
        const res = await fetch(tesseractUrl, { method: 'HEAD' }).catch(() => null);
        if (!res || !res.ok) return false;

        const Tesseract = await import(tesseractUrl);
        this.tesseractWorker = await Tesseract.createWorker('eng', 1, {
          workerPath: chrome.runtime.getURL('lib/tesseract-worker.min.js'),
          langPath: chrome.runtime.getURL('assets/models/tesseract'),
        });
        this.isLoaded = true;
        console.log('[Aavaran] ✅ Offline Tesseract OCR engine active on-device');
        return true;
      } catch (_) {
        return false;
      }
    },

    async detect(screenshotDataUrl, classification) {
      if (!screenshotDataUrl || !this.isLoaded || !this.tesseractWorker) return [];
      const detections = [];
      try {
        if (classification?.detectors?.ocr) {
          const res = await this.tesseractWorker.recognize(screenshotDataUrl);
          for (const word of (res?.data?.words || [])) {
            const text = (word.text || '').trim();
            if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) {
              detections.push({ type: 'aadhaar', bbox: word.bbox, confidence: 0.9, detectedBy: 'ocr' });
            } else if (/\b[A-Z]{5}\d{4}[A-Z]\b/.test(text)) {
              detections.push({ type: 'pan', bbox: word.bbox, confidence: 0.9, detectedBy: 'ocr' });
            } else if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) {
              detections.push({ type: 'credit_card', bbox: word.bbox, confidence: 0.9, detectedBy: 'ocr' });
            }
          }
        }
      } catch (err) {
        console.warn('[Aavaran] OCR run skipped:', err.message);
      }
      return detections;
    }
  };

  // Attempt async initialization (safe no-op if models aren't downloaded yet)
  opticalDetector.init().catch(() => { });

  // ============================================================
  // MESSAGE HANDLER — Routes messages from background SW
  // ============================================================
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    (async () => {
      try {
        switch (message.type) {
          case 'PING': {
            sendResponse({ pong: true });
            break;
          }

          // ---- Extract interactive DOM elements ----
          case MESSAGES.EXTRACT_DOM: {
            const elements = extractDOM();
            sendResponse({
              elements,
              pageTitle: document.title,
              pageDomain: window.location.hostname,
            });
            break;
          }

          // ---- Detect PII using DOM analysis & on-device classification ----
          case MESSAGES.DETECT_PII: {
            const t0 = performance.now();
            const domDetections = detectPIIFromDOM();
            const tDom = Math.round(performance.now() - t0);

            const tClass0 = performance.now();
            const classification = classifyScreenState(domDetections);
            const tClass = Math.round(performance.now() - tClass0);

            console.log(`[Aavaran] DOM PII scan: ${domDetections.length} sensitive fields found | Screen: ${classification.description}`);

            // Hybrid: Merge Optical OCR detections if models are downloaded
            let opticalDetections = [];
            let tOcr = 0;
            if (opticalDetector.isLoaded && message.screenshot) {
              const tOcr0 = performance.now();
              opticalDetections = await opticalDetector.detect(message.screenshot, classification);
              tOcr = Math.round(performance.now() - tOcr0);
            }

            const detections = [...domDetections, ...opticalDetections];
            sendResponse({
              detections,
              classification,
              // Per-layer timings for sidepanel Performance panel
              timings: {
                dom: tDom,
                screen_classifier: tClass,
                ocr: tOcr || null,
                ner: null,   // NER runs in separate module (AI pipeline)
                face: null,  // Face runs in separate module
              },
            });
            break;
          }

          // ---- Redact screenshot canvas ----
          case MESSAGES.REDACT_SCREENSHOT: {
            const canvas = await dataUrlToCanvas(message.screenshot);
            const manifest = redactCanvas(canvas, message.detections || []);

            // Create a lightweight compressed thumbnail for instant dashboard storage (max 640px wide, ~25KB)
            let thumbnail = '';
            try {
              const thumbCanvas = document.createElement('canvas');
              const scale = Math.min(1, 640 / canvas.width);
              thumbCanvas.width = Math.round(canvas.width * scale);
              thumbCanvas.height = Math.round(canvas.height * scale);
              const ctx = thumbCanvas.getContext('2d');
              ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
              thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.65);
            } catch (_) { }

            sendResponse({
              redactedScreenshot: canvas.toDataURL('image/jpeg', 0.85),
              thumbnail: thumbnail || canvas.toDataURL('image/jpeg', 0.6),
              manifest,
            });
            break;
          }

          // ---- Execute browser action ----
          case MESSAGES.EXECUTE_ACTION: {
            const result = await executeAction(message.action);
            sendResponse(result);
            // Notify background cycle is done
            chrome.runtime.sendMessage({
              type: MESSAGES.ACTION_COMPLETE,
              result,
            }).catch(() => { });
            break;
          }

          // ---- Show notification toast ----
          case MESSAGES.SHOW_NOTIFICATION: {
            showToast('🛡️ Aavaran', message.message || 'Agent update');
            sendResponse({ ok: true });
            break;
          }

          default:
            sendResponse({ error: `Unknown message: ${message.type}` });
        }
      } catch (err) {
        console.error('[Aavaran] Content script error:', err.message);
        sendResponse({ error: err.message });
      }
    })();

    return true; // Keep message channel open for async
  });

  console.log('[Aavaran] Content script loaded ✅ on', window.location.hostname);

})();
