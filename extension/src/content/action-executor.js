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
    this.scrollToElement(el);
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
    this.scrollToElement(el);
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

  async scroll(selector) {
    if (selector) {
      const el = this.findElement(selector);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollBy({ top: 400, behavior: 'smooth' });
    }
    await this.sleep(500);
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
      position: fixed; top: 24px; right: 24px; z-index: 999999;
      background: linear-gradient(135deg, rgba(99,102,241,0.95), rgba(139,92,246,0.95));
      color: white; padding: 16px 24px; border-radius: 16px;
      font-family: -apple-system, system-ui, sans-serif;
      font-size: 14px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      backdrop-filter: blur(20px); animation: slideIn 0.3s ease-out;
      max-width: 360px;
    `;
    toast.innerHTML = `
      <div style="font-weight:600;margin-bottom:4px">${title}</div>
      <div style="font-size:12px;opacity:0.85">${message || ''}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
