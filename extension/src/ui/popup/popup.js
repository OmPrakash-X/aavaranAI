// ============================================================
// Popup Script — MV3 compliant, no inline onclick handlers
// ============================================================

let actionCount = 0;

function downloadDataUrl(dataUrl, filename) {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || `aavaran_masked_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
  // ---- Wire up buttons via addEventListener (MV3 CSP requires this) ----
  document.getElementById('startBtn').addEventListener('click', startAgent);
  document.getElementById('stopBtn').addEventListener('click', stopAgent);

  const captureMaskedBtn = document.getElementById('captureMaskedBtn');
  if (captureMaskedBtn) {
    captureMaskedBtn.addEventListener('click', async () => {
      const originalText = captureMaskedBtn.innerHTML;
      captureMaskedBtn.innerHTML = '⏳ Masking...';
      captureMaskedBtn.disabled = true;

      try {
        let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!tab) {
          [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        }
        if (!tab?.id) {
          alert('No active webpage found. Please open an active website tab.');
          return;
        }
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
          alert('Cannot capture browser internal page (' + (tab.url.split('/')[2] || 'system') + '). Please switch to a website like github.com or google.com.');
          return;
        }

        chrome.runtime.sendMessage({ type: 'CAPTURE_MASKED_SCREENSHOT', tabId: tab.id }, (res) => {
          if (chrome.runtime.lastError || !res?.success) {
            alert('Capture failed: ' + (res?.error || chrome.runtime.lastError?.message));
            return;
          }

          const filename = `aavaran_masked_${(res.pageTitle || 'screen').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.png`;
          downloadDataUrl(res.redactedScreenshot, filename);
        });
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        setTimeout(() => {
          captureMaskedBtn.innerHTML = originalText;
          captureMaskedBtn.disabled = false;
        }, 1200);
      }
    });
  }

  // ---- Dashboard link ----
  document.getElementById('dashboardLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  });

  // ---- Check current agent status ----
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn('[Popup] Could not get status:', chrome.runtime.lastError.message);
      return;
    }
    if (response?.isRunning) {
      setRunningState(response.task);
    }
  });
});

// ---- Start Agent ----
async function startAgent() {
  const taskInput = document.getElementById('taskInput');
  const task = taskInput.value.trim();

  if (!task) {
    taskInput.style.borderColor = '#ef4444';
    taskInput.placeholder = 'Please enter a task first...';
    setTimeout(() => {
      taskInput.style.borderColor = '';
      taskInput.placeholder = 'e.g. Click on the Sign in button';
    }, 2000);
    return;
  }

  try {
    // Get the active tab in the current window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      console.error('[Popup] No active tab found');
      return;
    }

    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      taskInput.value = '';
      taskInput.placeholder = 'Cannot run on internal browser page. Open a website first!';
      taskInput.style.borderColor = '#ef4444';
      setTimeout(() => {
        taskInput.style.borderColor = '';
        taskInput.placeholder = 'e.g. Click on the Sign in button';
      }, 3500);
      return;
    }

    console.log('[Popup] Starting agent on tab', tab.id, '| Task:', task);

    // Send message to background service worker
    chrome.runtime.sendMessage(
      { type: 'START_AGENT', task, tabId: tab.id },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Popup] Error starting agent:', chrome.runtime.lastError.message);
          return;
        }
        console.log('[Popup] Agent started:', response);
      }
    );

    setRunningState(task);
    actionCount = 0;

  } catch (err) {
    console.error('[Popup] startAgent error:', err);
  }
}

// ---- Stop Agent ----
function stopAgent() {
  chrome.runtime.sendMessage({ type: 'STOP_AGENT' }, () => {
    if (chrome.runtime.lastError) {
      console.warn('[Popup] Stop error:', chrome.runtime.lastError.message);
    }
  });
  setIdleState();
}

// ---- UI: Running state ----
function setRunningState(task) {
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('stopBtn').style.display = 'block';
  document.getElementById('taskInput').disabled = true;
  document.getElementById('taskInput').value = task;
  document.getElementById('statusDot').className = 'status-dot running';
  document.getElementById('statusText').textContent = 'Running';
  document.getElementById('statusPill').className = 'status-pill running';
}

// ---- UI: Idle state ----
function setIdleState() {
  document.getElementById('startBtn').style.display = 'block';
  document.getElementById('stopBtn').style.display = 'none';
  document.getElementById('taskInput').disabled = false;
  document.getElementById('statusDot').className = 'status-dot idle';
  document.getElementById('statusText').textContent = 'Idle';
  document.getElementById('statusPill').className = 'status-pill idle';
}

// ---- Listen for metrics from background ----
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'METRICS_UPDATE') {
    actionCount++;
    document.getElementById('metricDetections').textContent = msg.detections ?? 0;
    document.getElementById('metricLatency').textContent = msg.latency ? `${msg.latency}ms` : '—';
    document.getElementById('metricActions').textContent = actionCount;
    document.getElementById('metricProvider').textContent = msg.provider || '—';
  }
  if (msg.type === 'STATUS_UPDATE' && !msg.isRunning) {
    setIdleState();
    if (msg.error) {
      const taskInput = document.getElementById('taskInput');
      if (taskInput) {
        taskInput.value = '';
        taskInput.placeholder = msg.error;
        taskInput.style.borderColor = '#ef4444';
        setTimeout(() => {
          taskInput.style.borderColor = '';
          taskInput.placeholder = 'e.g. Click on the Sign in button';
        }, 4000);
      }
    }
  }
});

