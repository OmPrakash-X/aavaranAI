// ============================================================
// Sidepanel Script — Chat-like interface for agent interaction
// ============================================================

const chatArea = document.getElementById('chatArea');
const taskInput = document.getElementById('taskInput');

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
        `${latencyText} · ${msg.provider} · ${msg.detections} PII redacted`
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

// ---- Add chat message ----
function addMessage(text, type, meta) {
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  div.textContent = text;

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
