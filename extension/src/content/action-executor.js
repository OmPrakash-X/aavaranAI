// ============================================================
// Action Executor — Executes VLM-planned actions in the browser
// ============================================================

export class ActionExecutor {
  /**
   * Execute a single action command from the server
   * @param {Object} action - { action, selector, value, reasoning }
   * @returns {Object} { success, done, error }
   */
  async execute(action) {
    try {
      console.log(`[Executor] Running: ${action.action} on "${action.selector}"`);

      switch (action.action) {
        case 'click':
          return await this.click(action.selector);
        case 'type':
          return await this.type(action.selector, action.value);
        case 'scroll':
          return await this.scroll(action.selector);
        case 'select':
          return await this.select(action.selector, action.value);
        case 'hover':
          return await this.hover(action.selector);
        case 'navigate':
          return this.navigate(action.value);
        case 'wait':
          return await this.wait(parseInt(action.value) || 2000);
        case 'done':
          this.showNotification('✅ Task completed!', action.reasoning);
          return { success: true, done: true };
        default:
          return { success: false, error: `Unknown action: ${action.action}` };
      }
    } catch (err) {
      console.error('[Executor] Action failed:', err);
      return { success: false, error: err.message };
    }
  }

  async click(selector) {
    const el = this.findElement(selector);
    await this.sleep(300);
    this.highlight(el, '#6366f1');
    await this.sleep(200);
    el.click();
    this.pulse(el);
    return { success: true, done: false };
  }

  async type(selector, value) {
    if (!value) return { success: false, error: 'No value to type' };

    const el = this.findElement(selector);
    el.focus();
    this.highlight(el, '#6366f1');

    // Clear existing value
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));

    // Simulate realistic typing
    for (const char of value) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      el.value += char;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await this.sleep(30 + Math.random() * 40);
    }

    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    this.pulse(el);
    return { success: true, done: false };
  }

  async scroll(selector, value) {
    const scrollVal = value || '';
    const scrollNum = parseInt(scrollVal, 10);
    const isUp = /^up$/i.test(scrollVal.trim());
    const scrollPx = !isNaN(scrollNum) ? scrollNum : 500;
    const scrollDir = isUp ? -scrollPx : scrollPx;

    if (selector) {
      const el = this.findElement(selector);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollBy({ top: scrollDir, behavior: 'smooth' });
    }
    await this.sleep(800);
    return { success: true, done: false };
  }

  async select(selector, value) {
    const el = this.findElement(selector);
    this.highlight(el, '#6366f1');
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    this.pulse(el);
    return { success: true, done: false };
  }

  async hover(selector) {
    const el = this.findElement(selector);
    this.scrollToElement(el);
    el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    this.highlight(el, '#818cf8');
    return { success: true, done: false };
  }

  navigate(url) {
    if (url) window.location.href = url;
    return { success: true, done: false };
  }

  async wait(ms) {
    await this.sleep(ms);
    return { success: true, done: false };
  }

  // ---- Helpers ----

  findElement(selector) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    return el;
  }

  scrollToElement(el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  highlight(el, color) {
    el.style.outline = `3px solid ${color}`;
    el.style.outlineOffset = '2px';
    el.style.transition = 'outline 0.3s ease';
    setTimeout(() => {
      el.style.outline = '';
      el.style.outlineOffset = '';
    }, 2000);
  }

  pulse(el) {
    el.animate([
      { boxShadow: '0 0 0 0 rgba(99,102,241,0.6)' },
      { boxShadow: '0 0 0 16px rgba(99,102,241,0)' },
    ], { duration: 600, easing: 'ease-out' });
  }

  showNotification(title, message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      background: rgba(255, 255, 255, 0.94);
      color: #111111; padding: 14px 18px; border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      max-width: 340px; min-width: 240px;
      display: flex; flex-direction: column; gap: 4px;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateY(-8px); opacity: 0;
      pointer-events: none;
    `;
    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: #0D0D0D; color: #FFFFFF; font-size: 11px; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">🛡️</span>
        <span style="font-size: 13px; font-weight: 700; color: #111111; letter-spacing: -0.01em;">${title || 'Aavaran Agent'}</span>
      </div>
      <div style="font-size: 12px; line-height: 1.5; color: #666666; font-weight: 400; padding-left: 30px;">${message || ''}</div>
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

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
