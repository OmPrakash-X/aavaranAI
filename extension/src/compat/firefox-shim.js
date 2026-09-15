/**
 * Aavaran — Firefox (Gecko) Compatibility Shim
 * Bridges chrome.* API calls to browser.* (Promise-based) APIs
 *
 * Firefox uses the WebExtension standard with Promise-based browser.* APIs.
 * Chrome uses callback-based chrome.* APIs.
 * This shim makes the same content/background code work in both browsers.
 *
 * Usage: Load this script FIRST in both content scripts and background (via manifest)
 *   Firefox: "scripts": ["src/compat/firefox-shim.js", "src/background/index.js"]
 *   Chrome:  Not needed — chrome.* already works natively
 */

(function () {
  'use strict';

  // Already using native browser API (Firefox) — nothing to shim
  if (typeof browser !== 'undefined' && browser.runtime) {
    // Create a chrome alias that proxies to browser, converting Promise-based API
    // back to callback-style so existing chrome.* calls work unchanged.
    if (typeof chrome === 'undefined') {
      window.chrome = {};
    }

    /**
     * Wraps a browser.* Promise API into a callback-style chrome.* equivalent
     */
    function wrapPromiseToCallback(fn) {
      return function (...args) {
        // Last argument is the callback if it's a function
        const lastArg = args[args.length - 1];
        const hasCallback = typeof lastArg === 'function';
        const callback = hasCallback ? args.pop() : null;

        const result = fn(...args);

        if (result && typeof result.then === 'function') {
          result.then(
            (res) => {
              if (callback) callback(res);
            },
            (err) => {
              // Set chrome.runtime.lastError equivalent
              if (chrome.runtime) {
                chrome.runtime.lastError = { message: err?.message || String(err) };
              }
              if (callback) callback(undefined);
              if (chrome.runtime) {
                delete chrome.runtime.lastError;
              }
            }
          );
        } else {
          if (callback) callback(result);
        }
      };
    }

    // ── runtime ──────────────────────────────────────────────────────────────
    if (!chrome.runtime) chrome.runtime = {};
    chrome.runtime.sendMessage    = wrapPromiseToCallback(browser.runtime.sendMessage.bind(browser.runtime));
    chrome.runtime.getURL         = browser.runtime.getURL.bind(browser.runtime);
    chrome.runtime.onMessage      = browser.runtime.onMessage;
    chrome.runtime.lastError      = null;

    // ── tabs ─────────────────────────────────────────────────────────────────
    if (!chrome.tabs) chrome.tabs = {};
    chrome.tabs.query             = wrapPromiseToCallback(browser.tabs.query.bind(browser.tabs));
    chrome.tabs.get               = wrapPromiseToCallback(browser.tabs.get.bind(browser.tabs));
    chrome.tabs.sendMessage       = wrapPromiseToCallback(browser.tabs.sendMessage.bind(browser.tabs));
    chrome.tabs.create            = wrapPromiseToCallback(browser.tabs.create.bind(browser.tabs));
    // captureVisibleTab in Firefox requires activeTab permission
    chrome.tabs.captureVisibleTab = wrapPromiseToCallback(
      (windowId, opts) => browser.tabs.captureVisibleTab(windowId, opts)
    );

    // ── scripting ────────────────────────────────────────────────────────────
    if (!chrome.scripting) chrome.scripting = {};
    chrome.scripting.executeScript = wrapPromiseToCallback(
      browser.scripting
        ? browser.scripting.executeScript.bind(browser.scripting)
        : (opts) => browser.tabs.executeScript(opts.target.tabId, { file: opts.files[0] })
    );

    // ── storage ──────────────────────────────────────────────────────────────
    if (!chrome.storage) chrome.storage = {};
    if (!chrome.storage.local) {
      chrome.storage.local = {
        get:    wrapPromiseToCallback(browser.storage.local.get.bind(browser.storage.local)),
        set:    wrapPromiseToCallback(browser.storage.local.set.bind(browser.storage.local)),
        remove: wrapPromiseToCallback(browser.storage.local.remove.bind(browser.storage.local)),
      };
    }

    // ── sidePanel (Firefox uses sidebar_action) ──────────────────────────────
    // Firefox doesn't have chrome.sidePanel — stub it so background.js doesn't throw
    if (!chrome.sidePanel) {
      chrome.sidePanel = {
        setPanelBehavior: () => Promise.resolve(),
        open: () => Promise.resolve(),
      };
    }

    console.log('[Aavaran] Firefox compatibility shim active ✅');
  }
})();
