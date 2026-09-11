// ============================================================
// Background Service Worker — Agent loop orchestrator
// Self-contained — no ES module imports needed
// (Background type:module works, but inlining avoids path issues)
// ============================================================

// ---- Inlined Constants ----
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
  ACTION_COMPLETE: 'ACTION_COMPLETE',
  SCREEN_CLASSIFIED: 'SCREEN_CLASSIFIED',
};

const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  CAPTURE_DELAY_MS: 2000,
  SETTLE_DELAY_MS: 1500,
  MAX_RETRIES: 3,
  SCREENSHOT_QUALITY: 90,
};

// ---- Agent State ----
let isAgentRunning = false;
let currentTask = '';
let sanitizedTask = '';
let sessionId = null;
let activeTabId = null;
let lastClassification = null;

// ---- On-Device Local Privacy Vault ----
// Sensitive credentials (passwords, usernames, OTPs, emails) are tokenized
// and stored ONLY in local browser memory. The server and VLM only see opaque
// tokens like <LOCAL_SECRET_1>. The real secrets NEVER leave the user's device!
const localVault = new Map();

function tokenizeTaskLocally(rawTask) {
  localVault.clear();
  let sanitized = rawTask;
  let counter = 1;

  // Patterns for credential / sensitive value extraction
  const labelPatterns = [
    /(?:username|usernamie|user|email|login)\s*(?:is|:|=|\b)\s*['"]?([^\s,;'"]+)['"]?/gi,
    /(?:password|passowrd|pass|pwd|secret)\s*(?:is|:|=|\b)\s*['"]?([^\s,;'"]+)['"]?/gi,
    /(?:otp|pin|cvv|code)\s*(?:is|:|=|\b)\s*['"]?(\d+)['"]?/gi,
    /(?:type|enter|input|fill)\s+['"]?([^\s'"]+)['"]?\s+(?:in|into)\s+(?:the\s+)?(?:username|user|email|login|password|pass|pwd|field|input)/gi,
  ];

  for (const pattern of labelPatterns) {
    let match;
    while ((match = pattern.exec(rawTask)) !== null) {
      const secret = match[1];
      if (secret && secret.length > 0 && !/^(the|a|an|is|in|into|then|and|or|for|to)$/i.test(secret) && !secret.startsWith('<LOCAL_')) {
        const token = `<LOCAL_SECRET_${counter++}>`;
        localVault.set(token, secret);
        sanitized = sanitized.split(secret).join(token);
      }
    }
  }

  // Also protect raw email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  let emailMatch;
  while ((emailMatch = emailRegex.exec(rawTask)) !== null) {
    const email = emailMatch[0];
    if (!email.startsWith('<LOCAL_')) {
      const token = `<LOCAL_SECRET_${counter++}>`;
      localVault.set(token, email);
      sanitized = sanitized.split(email).join(token);
    }
  }

  console.log(`[Aavaran] Local Privacy Vault active: ${localVault.size} secret(s) protected locally on-device.`);
  return sanitized;
}

function detokenizeValue(val) {
  if (!val || typeof val !== 'string') return val;
  let resolved = val;
  for (const [token, secret] of localVault.entries()) {
    resolved = resolved.split(`'${token}'`).join(secret);
    resolved = resolved.split(`"${token}"`).join(secret);
    resolved = resolved.split(token).join(secret);
  }
  return resolved;
}

// ---- Loop detection ----
let lastActionKey = '';   // "action:selector"
let repeatCount = 0;
const MAX_REPEATS = 3;    // Stop if same action repeats 3 times

// ---- Submit detection ----
// After clicking a sign-in/submit button, the NEXT cycle should auto-stop
// because the task (form submission) is complete regardless of where the page goes
let justSubmittedForm = false;
const SUBMIT_KEYWORDS = /sign.?in|log.?in|submit|register|sign.?up|enter|continue|next/i;

// ---- Message Router ----
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case MESSAGES.START_AGENT:
      startAgent(msg.task, msg.tabId);
      sendResponse({ status: 'started', sessionId });
      break;
    case MESSAGES.STOP_AGENT:
      stopAgent();
      sendResponse({ status: 'stopped' });
      break;
    case MESSAGES.GET_STATUS:
      sendResponse({ isRunning: isAgentRunning, task: currentTask, sessionId });
      break;
    case MESSAGES.ACTION_COMPLETE:
      if (isAgentRunning && msg.result && !msg.result.done) {
        if (msg.result.wasSubmit) {
          justSubmittedForm = true;
          console.log('[Aavaran] Submit action completed — next cycle will auto-stop.');
        }
        setTimeout(() => runCycle(), CONFIG.SETTLE_DELAY_MS);
      } else if (msg.result?.done) {
        stopAgent();
      }
      break;
    case 'FORM_SUBMIT_CLICKED':
      justSubmittedForm = true;
      console.log('[Aavaran] Submit button clicked in DOM — will auto-stop after action completes.');
      sendResponse({ ok: true });
      break;
    default:
      sendResponse({ error: 'Unknown message' });
  }
  return true; // Keep channel open for async
});

// ---- Side Panel ----
chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false }).catch(() => { });

function isRestrictedUrl(url) {
  if (!url) return true;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('devtools://') ||
    url.includes('chromewebstore.google.com')
  );
}

// ---- Agent Lifecycle ----
async function startAgent(task, tabId) {
  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch (err) {
    console.warn('[Aavaran] Unable to get tab:', err);
  }

  if (tab?.url && isRestrictedUrl(tab.url)) {
    const pageName = tab.url.split('/')[2] || 'internal';
    console.warn('[Aavaran] Cannot run on restricted page:', tab.url);
    broadcast({
      type: MESSAGES.STATUS_UPDATE,
      isRunning: false,
      error: `Cannot run agent on browser internal page (${pageName}). Open an actual webpage like github.com or google.com.`,
      sessionId: null,
    });
    return;
  }

  isAgentRunning = true;
  // Tokenize credentials locally — server never sees user passwords/PII
  sanitizedTask = tokenizeTaskLocally(task);
  currentTask = sanitizedTask;
  sessionId = crypto.randomUUID();
  activeTabId = tabId;
  lastActionKey = '';
  repeatCount = 0;
  justSubmittedForm = false;
  console.log(`[Aavaran] Agent started | Sanitized Task: "${sanitizedTask}" | Tab: ${tabId}`);
  broadcast({ type: MESSAGES.STATUS_UPDATE, isRunning: true, task: sanitizedTask, sessionId });

  // Ensure content script is ready before first cycle
  await ensureContentScript(tabId);

  runCycle();
}

function stopAgent() {
  isAgentRunning = false;
  currentTask = '';
  sanitizedTask = '';
  localVault.clear();
  activeTabId = null;
  console.log('[Aavaran] Agent stopped & Local Vault cleared');
  broadcast({ type: MESSAGES.STATUS_UPDATE, isRunning: false, task: '', sessionId });
}

function broadcast(msg) {
  chrome.runtime.sendMessage(msg).catch(() => { });
}

// ---- Core Agent Cycle ----
async function runCycle() {
  if (!isAgentRunning || !activeTabId) return;

  // ---- Post-submit auto-stop ----
  // If the previous cycle clicked a submit/login button and the page settled,
  // the form was submitted. Stop now before making another server call.
  if (justSubmittedForm) {
    console.log('[Aavaran] Post-submit detected at cycle start — stopping agent. Task complete.');
    await sendToTab(activeTabId, {
      type: MESSAGES.SHOW_NOTIFICATION,
      message: '✅ Form submitted successfully. Task complete!',
    }).catch(() => { });
    justSubmittedForm = false;
    stopAgent();
    return;
  }

  try {
    console.log('[Aavaran] Running cycle...');
    const clientStartTime = performance.now();

    // Step 1: Capture screenshot from active tab's window
    let tab;
    try {
      tab = await chrome.tabs.get(activeTabId);
    } catch (e) {
      throw new Error('Active tab is no longer available');
    }

    if (!tab || isRestrictedUrl(tab.url)) {
      throw new Error('Target tab is a browser internal page (' + (tab?.url || 'system') + '). Navigate to a standard website first.');
    }

    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: CONFIG.SCREENSHOT_QUALITY,
    });
    console.log('[Aavaran] Screenshot captured');

    // Step 2: Extract DOM elements
    const domData = await sendToTab(activeTabId, { type: MESSAGES.EXTRACT_DOM });
    console.log(`[Aavaran] DOM extracted: ${domData.elements?.length || 0} elements`);

    // Step 3: Detect PII using DOM analysis in content script
    const piiData = await sendToTab(activeTabId, {
      type: MESSAGES.DETECT_PII,
      screenshot,
    });
    lastClassification = piiData.classification || null;
    console.log(`[Aavaran] PII detected: ${piiData.detections?.length || 0} items`);

    // Broadcast screen classification to sidepanel
    if (lastClassification) {
      broadcast({ type: MESSAGES.SCREEN_CLASSIFIED, classification: lastClassification });
    }

    // Step 4: Redact screenshot in content script
    const redacted = await sendToTab(activeTabId, {
      type: MESSAGES.REDACT_SCREENSHOT,
      screenshot,
      detections: piiData.detections || [],
    });
    console.log('[Aavaran] Screenshot redacted, sending to server...');

    const clientLatency = Math.round(performance.now() - clientStartTime);

    // Step 5: Send sanitized data to VLM server
    const serverResult = await callServer({
      screenshot: redacted.redactedScreenshot,
      thumbnail: redacted.thumbnail,
      domElements: domData.elements || [],
      redactionManifest: redacted.manifest || [],
      userTask: sanitizedTask || currentTask,
      pageTitle: domData.pageTitle || '',
      sessionId,
      clientLatency,
      screenClassification: lastClassification
        ? {
          screenType: lastClassification.screenType,
          description: lastClassification.description,
          confidence: lastClassification.confidence,
          device: lastClassification.device,
        }
        : null,
    });
    console.log('[Aavaran] Server response:', serverResult.action);

    // ---- Loop detection ----
    const actionKey = `${serverResult.action?.action}:${serverResult.action?.selector}`;
    if (actionKey === lastActionKey) {
      repeatCount++;
      if (repeatCount >= MAX_REPEATS) {
        console.warn(`[Aavaran] Loop detected! Same action repeated ${repeatCount}x: "${actionKey}". Stopping.`);
        await sendToTab(activeTabId, {
          type: MESSAGES.SHOW_NOTIFICATION,
          message: `Agent stopped: repeated "${serverResult.action?.action}" ${repeatCount} times on "${serverResult.action?.selector}". Try a more specific task.`,
        });
        stopAgent();
        return;
      }
    } else {
      lastActionKey = actionKey;
      repeatCount = 0;
    }

    // Step 6: Broadcast metrics to popup/sidepanel
    broadcast({
      type: MESSAGES.METRICS_UPDATE,
      latency: (serverResult.latency || 0) + (clientLatency || 0),
      serverLatency: serverResult.latency,
      clientLatency,
      action: serverResult.action,
      provider: serverResult.provider,
      detections: piiData.detections?.length || 0,
    });

    // Step 7: Done?
    if (serverResult.action?.action === 'done') {
      await sendToTab(activeTabId, {
        type: MESSAGES.SHOW_NOTIFICATION,
        message: serverResult.action.reasoning || '✅ Task complete!',
      });
      stopAgent();
      return;
    }

    // Step 8: Execute the action in the page (with on-device de-tokenization)
    if (serverResult.action) {
      // Local de-tokenization: Swap opaque <LOCAL_SECRET_*> back into real values right before typing into the page
      const actionToExecute = {
        ...serverResult.action,
        value: detokenizeValue(serverResult.action.value),
      };

      // Detect if this is a form submit click — ONLY auto-stop for login tasks
      const action = actionToExecute;
      const isLoginTask = /sign.?in|log.?in|login|sign.?up|register|credentials?/i.test(sanitizedTask || currentTask);
      if (action.action === 'click' && isLoginTask) {
        const selectorText = (action.selector || '').toLowerCase();
        const valueText = (action.value || '').toLowerCase();
        const reasonText = (action.reasoning || '').toLowerCase();
        const isSubmitClick = SUBMIT_KEYWORDS.test(selectorText) ||
          SUBMIT_KEYWORDS.test(valueText) ||
          SUBMIT_KEYWORDS.test(reasonText);
        if (isSubmitClick) {
          console.log('[Aavaran] Login submit clicked — will auto-stop after next cycle.');
          justSubmittedForm = true;
        }
      }

      await sendToTab(activeTabId, {
        type: MESSAGES.EXECUTE_ACTION,
        action: actionToExecute,
      });
    }

    // Next cycle triggered by ACTION_COMPLETE from content script

  } catch (err) {
    const errMsg = err.message || String(err);
    console.error('[Aavaran] Cycle error:', errMsg);

    // Stop and report non-retryable / configuration errors
    const isFatal =
      errMsg.includes('Cannot connect to Aavaran server') ||
      errMsg.includes('browser internal page') ||
      errMsg.includes('activeTab') ||
      errMsg.includes('no longer available');

    if (isFatal) {
      broadcast({
        type: MESSAGES.STATUS_UPDATE,
        isRunning: false,
        error: errMsg,
      });
      stopAgent();
      return;
    }

    if (isAgentRunning) {
      // Auto-retry after delay
      setTimeout(() => runCycle(), CONFIG.CAPTURE_DELAY_MS * 2);
    }
  }
}

// ---- Helpers ----
/**
 * Ensure content script is running on the tab; inject dynamically if not.
 */
async function ensureContentScript(tabId) {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    if (res?.pong) return true;
  } catch (_) {
    // Content script not answering
  }

  console.log(`[Aavaran] Injecting content script into tab ${tabId}...`);
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/index.js'],
    });
    await new Promise(r => setTimeout(r, 400));
    return true;
  } catch (err1) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/content/index.js'],
      });
      await new Promise(r => setTimeout(r, 400));
      return true;
    } catch (err2) {
      console.warn('[Aavaran] Dynamic script injection failed:', err2.message);
      return false;
    }
  }
}

/**
 * Send a message to a tab's content script.
 * Retries up to MAX_TAB_RETRIES times if the content script isn't ready yet
 * (e.g. page just navigated and the script is still injecting).
 */
const MAX_TAB_RETRIES = 5;
const TAB_RETRY_DELAY_MS = 800;

async function sendToTab(tabId, msg, attempt = 1) {
  try {
    return await chrome.tabs.sendMessage(tabId, msg);
  } catch (err) {
    const isConnectionError = err?.message?.includes('Receiving end does not exist') ||
      err?.message?.includes('Could not establish connection');

    if (isConnectionError && attempt <= MAX_TAB_RETRIES) {
      console.warn(`[Aavaran] Content script not ready (attempt ${attempt}/${MAX_TAB_RETRIES}), recovering...`);
      if (attempt === 1) {
        await ensureContentScript(tabId);
      } else {
        await new Promise(r => setTimeout(r, TAB_RETRY_DELAY_MS));
      }
      return sendToTab(tabId, msg, attempt + 1);
    }

    throw err;
  }
}

async function callServer(data) {
  const url = `${CONFIG.SERVER_URL}/api/v1/analyze`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Server ${res.status}: ${errText}`);
    }
    return res.json();
  } catch (err) {
    if (err.name === 'TypeError' && (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError'))) {
      throw new Error(`Cannot connect to Aavaran server at ${CONFIG.SERVER_URL}. Is Next.js running ("npm run dev" in /web)?`);
    }
    throw err;
  }
}

console.log('[Aavaran] Service worker loaded ✅');
