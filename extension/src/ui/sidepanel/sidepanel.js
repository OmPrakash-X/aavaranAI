// ============================================================
// Sidepanel Script — Chat-like interface for agent interaction
// ============================================================

const chatArea = document.getElementById('chatArea');
const taskInput = document.getElementById('taskInput');
const captureBtn = document.getElementById('captureBtn');

// ---- Helper: Download Data URL as File ----
function downloadDataUrl(dataUrl, filename) {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || `aavaran_masked_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ---- Direct Masked Screen Capture & Download ----
async function handleCaptureMasked() {
  if (!captureBtn) return;
  const originalText = captureBtn.innerHTML;
  captureBtn.innerHTML = `<span>⏳ Masking...</span>`;
  captureBtn.disabled = true;

  try {
    let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tab) {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    }
    if (!tab?.id) {
      addMessage('❌ No active webpage tab found', 'agent');
      return;
    }

    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      addMessage('⚠️ Cannot capture browser internal page (' + (tab.url.split('/')[2] || 'system') + '). Please switch to a website like github.com first.', 'agent');
      return;
    }

    chrome.runtime.sendMessage({ type: 'CAPTURE_MASKED_SCREENSHOT', tabId: tab.id }, (res) => {
      if (chrome.runtime.lastError || !res?.success) {
        addMessage(`⚠️ Capture failed: ${res?.error || chrome.runtime.lastError?.message}`, 'agent');
        return;
      }

      const filename = `aavaran_masked_${(res.pageTitle || 'screen').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
      downloadDataUrl(res.redactedScreenshot, filename);

      addMessage(
        `📸 Saved masked screenshot (${res.detectionsCount} sensitive items redacted on-device)`,
        'agent',
        `${new Date().toLocaleTimeString()} · Download complete`,
        res.redactedScreenshot
      );
    });
  } catch (err) {
    addMessage(`⚠️ Error: ${err.message}`, 'agent');
  } finally {
    setTimeout(() => {
      if (captureBtn) {
        captureBtn.innerHTML = originalText;
        captureBtn.disabled = false;
      }
    }, 1000);
  }
}

if (captureBtn) {
  captureBtn.addEventListener('click', handleCaptureMasked);
}

// ---- Send Task ----
async function handleSend() {
  const task = taskInput.value.trim();
  if (!task) return;

  // Clear welcome message
  const welcome = chatArea.querySelector('.welcome');
  if (welcome) welcome.remove();

  // Show user message
  addMessage(task, 'user');
  taskInput.value = '';

  // Show agent thinking
  addMessage('🔍 Analyzing the page and detecting PII...', 'agent');

  // Get active tab and start agent
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    addMessage('❌ No active tab found', 'agent');
    return;
  }

  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
    addMessage('⚠️ Cannot run on browser internal page (' + (tab.url.split('/')[2] || 'system') + '). Please open a standard webpage (e.g. github.com) and try again.', 'agent');
    return;
  }

  chrome.runtime.sendMessage({
    type: 'START_AGENT',
    task,
    tabId: tab.id,
  });

  document.getElementById('spStatus').textContent = '● Running';
  document.getElementById('spStatus').style.color = '#22c55e';
}

// ---- Listen for updates ----
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'METRICS_UPDATE') {
    const action = msg.action;
    if (action) {
      const latencyText = msg.clientLatency
        ? `${msg.latency}ms (${msg.clientLatency}ms edge + ${msg.serverLatency || 0}ms cloud)`
        : `${msg.latency}ms`;
      addMessage(
        `⚡ ${action.action.toUpperCase()}: ${action.reasoning}`,
        'action',
        `${latencyText} · ${msg.provider} · ${msg.detections} PII redacted`,
        msg.redactedScreenshot || msg.thumbnail
      );
    }
  }

  if (msg.type === 'SCREEN_CLASSIFIED') {
    const c = msg.classification;
    if (c) {
      addMessage(
        `👁️ Screen State: ${c.description || c.screenType}`,
        'agent',
        `${(c.confidence * 100).toFixed(0)}% confidence · ${c.device?.toUpperCase() || 'WEBGPU'} perception`
      );
    }
  }

  if (msg.type === 'STATUS_UPDATE') {
    if (!msg.isRunning) {
      document.getElementById('spStatus').textContent = '● Idle';
      document.getElementById('spStatus').style.color = '#71717a';
      if (msg.error) {
        addMessage(`⚠️ ${msg.error}`, 'agent');
      } else if (msg.task) {
        addMessage('✅ Task completed!', 'agent');
      }
    }
  }
});

// ---- Add chat message with optional screenshot preview & download ----
function addMessage(text, type, meta, screenshotDataUrl) {
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  div.textContent = text;

  if (screenshotDataUrl) {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'msg-screenshot-preview';

    const img = document.createElement('img');
    img.src = screenshotDataUrl;
    img.alt = 'Redacted Screen Frame';
    img.title = 'Click to download full masked frame';
    img.addEventListener('click', () => {
      downloadDataUrl(screenshotDataUrl, `aavaran_masked_step_${Date.now()}.png`);
    });

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-frame-download';
    downloadBtn.innerHTML = `
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      <span>Download Masked Frame (PNG)</span>
    `;
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      downloadDataUrl(screenshotDataUrl, `aavaran_masked_step_${Date.now()}.png`);
    });

    previewContainer.appendChild(img);
    div.appendChild(previewContainer);
    div.appendChild(downloadBtn);
  }

  if (meta) {
    const metaEl = document.createElement('div');
    metaEl.className = 'msg-meta';
    metaEl.textContent = meta;
    div.appendChild(metaEl);
  }

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ---- Enter key ----
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSend();
});

// ---- Init ----
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
  if (res?.isRunning) {
    document.getElementById('spStatus').textContent = '● Running';
    document.getElementById('spStatus').style.color = '#22c55e';
    const welcome = chatArea.querySelector('.welcome');
    if (welcome) welcome.remove();
    addMessage(`📋 Task: ${res.task}`, 'user');
    addMessage('🔄 Agent is running...', 'agent');
  }
});

window.handleSend = handleSend;
window.handleCaptureMasked = handleCaptureMasked;
