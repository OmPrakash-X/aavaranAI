# 🛡️ Aavaran — Deep Technical Explainer
### "Privacy-First AI Browser Agent" — How It All Works

---

## 🧠 The Core Idea (Explain in 30 seconds)

> **"It's an AI that browses the web FOR you — but before sending any screenshot to the cloud AI, it blacks out all your private data (faces, passwords, credit cards) ON your own device first."**

Normal AI agents (like browser-use, OpenAI Operator) send your FULL screenshots to the cloud. Aavaran says: **nope — we redact first, send second**.

---

## 🗺️ The Big Picture (Two Parts)

```
┌─────────────────────────────────────────────────┐
│            PART 1: Chrome Extension              │
│                                                  │
│  Your browser runs ALL the sensitive stuff here  │
│  • Screenshots happen locally                    │
│  • Face/PII detection runs ON-DEVICE             │
│  • Redaction (black box drawing) happens locally │
│  • Passwords NEVER leave your machine            │
└───────────────────┬─────────────────────────────┘
                    │  Only SAFE/REDACTED data goes up
                    ▼
┌─────────────────────────────────────────────────┐
│            PART 2: Next.js Web Server            │
│                                                  │
│  Cloud gets the BLURRED screenshot → thinks      │
│  • Gemini AI looks at blurred screenshot         │
│  • Returns: "click the Sign In button"           │
│  • Saves analytics to MongoDB                    │
│  • Dashboard shows what happened                 │
└─────────────────────────────────────────────────┘
```

---

## 🔄 The Complete Step-by-Step Flow

### When you type "Log into GitHub with username john@gmail.com password mypass123"

---

### **STEP 0 — Credential Protection (Before ANYTHING)**
📍 *File: `extension/src/background/index.js` → `tokenizeTaskLocally()`*

```
Your task: "Log into GitHub, username john@gmail.com, password mypass123"
           ↓
Aavaran scans for emails, passwords, usernames using regex
           ↓
Creates a local in-memory "vault":
  <LOCAL_SECRET_1> = "john@gmail.com"
  <LOCAL_SECRET_2> = "mypass123"
           ↓
Sanitized task sent to server: "Log into GitHub, username <LOCAL_SECRET_1>, password <LOCAL_SECRET_2>"
```

> ⚡ **WHY THIS IS BRILLIANT**: The AI cloud (Gemini) only sees `<LOCAL_SECRET_2>`. When it says "type `<LOCAL_SECRET_2>` in the password field", the extension secretly swaps it back to `mypass123` ON DEVICE before typing it. The password NEVER exists in the cloud. This is called a **local privacy vault**.

---

### **STEP 1 — Screenshot Capture**
📍 *File: `extension/src/background/index.js` → `runCycle()` line 246*

```javascript
const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
  format: 'png',
  quality: 90
});
```

Chrome's built-in API captures what you see on screen. This is just a base64-encoded PNG image sitting in memory. **Nothing sent anywhere yet.**

---

### **STEP 2 — DOM Extraction**
📍 *File: `extension/src/content/` → `EXTRACT_DOM` handler*

The background worker tells the **content script** (which lives inside the webpage) to scan the DOM:

```
Scans every visible interactive element:
  <input type="text" /> → "username field at position (300, 200)"
  <input type="password" /> → "password field at position (300, 250)"
  <button>Sign In</button> → "submit button at position (300, 300)"
```

Returns a list like:
```json
[
  { "tag": "input", "type": "text", "selector": "#login-field", "bbox": { "x": 300, "y": 200 } },
  { "tag": "button", "text": "Sign In", "selector": ".js-sign-in-button", "bbox": { "x": 300, "y": 300 } }
]
```

> **WHY**: Instead of letting the AI *guess* what to click on from the image, we hand it the EXACT CSS selectors. Far more reliable.

---

### **STEP 3 — PII Detection (The Most Clever Part)**
📍 *File: `extension/src/ai/pipeline/vision.pipeline.js` + `detectors/`*

Three detectors run **in parallel on your device**:

| Detector | Technology | What it finds |
|---|---|---|
| **Face Detector** | MediaPipe (Google, runs in WASM) | Human faces on screen |
| **OCR Detector** | Tesseract.js (offline OCR engine) | Text that looks like credit cards, SSNs, phone numbers |
| **DOM Detector** | Regex + DOM analysis | Password fields, sensitive input labels |

Each returns **bounding boxes** — coordinates of WHERE the sensitive thing is on screen:
```json
[
  { "type": "face", "bbox": { "x": 50, "y": 100, "width": 80, "height": 80 }, "strategy": "mediapipe" },
  { "type": "password_field", "bbox": { "x": 300, "y": 250, "width": 200, "height": 30 }, "strategy": "dom" }
]
```

> ⚡ **KEY INSIGHT**: All three detectors run **inside the browser tab** using WebAssembly. No network call. No server sees this data.

---

### **STEP 4 — Redaction (Painting Black Boxes)**
📍 *File: `extension/src/privacy/redaction/`*

Takes the screenshot (a PNG) + detection bounding boxes → draws black rectangles over everything sensitive using the **Canvas API**:

```
Original screenshot:      Redacted screenshot:
┌─────────────────┐        ┌─────────────────┐
│ 😊 John's face  │   →    │ ██████████████  │
│ Password: •••   │        │ Password: •••   │
│ CC: 4242 4242   │        │ CC: ████████    │
│ [Sign In]       │        │ [Sign In]       │
└─────────────────┘        └─────────────────┘
```

The output is a new base64 PNG. Password field is visually blacked out (but the DOM still shows `selector: "#password"` — Gemini will know WHERE to type, even without seeing what's there).

---

### **STEP 5 — Server Call**
📍 *File: `extension/src/background/index.js` → `callServer()`*

Now — and ONLY now — data leaves your device:

```javascript
POST http://localhost:3000/api/v1/analyze
{
  screenshot: "<redacted base64 PNG>",   // faces/PII are black boxes
  userTask: "Log into GitHub, username <LOCAL_SECRET_1>, password <LOCAL_SECRET_2>",
  sessionId: "abc-123",
  domElements: [...],                     // the CSS selectors list
  redactionManifest: [...]                // what was redacted + why
}
```

> **What the server CANNOT see**: real passwords, real emails, real faces — all replaced with tokens or black pixels.

---

### **STEP 6 — Gemini VLM Analysis**
📍 *File: `web/src/lib/providers/gemini.provider.ts`*

The Next.js server sends the redacted screenshot to **Google Gemini** (a Vision Language Model):

**What Gemini receives:**
- 🖼️ The blurred/redacted screenshot
- 📝 The system prompt (teaches it how to be a browser agent)
- 📋 The user task (with `<LOCAL_SECRET_X>` tokens, not real passwords)
- 🗂️ The DOM element list (exact selectors)
- 📜 History of past actions this session

**The System Prompt key lines:**
```
"You are Aavaran, a privacy-preserving browser automation agent..."
"Use the EXACT selector from DOM metadata — do not invent selectors."
"One action per response. Make it count."
"Return valid JSON only."
```

**Gemini responds:**
```json
{
  "action": "type",
  "selector": "#login-field",
  "value": "<LOCAL_SECRET_1>",
  "reasoning": "Typing username into the email field to start login",
  "nextExpectation": "Email field will contain the username"
}
```

**Multi-Model Cascade (Fallback):** If `gemini-1.5-flash` is rate-limited, automatically tries `gemini-2.0-flash`, then `gemini-1.5-flash-8b`, then `gemini-1.5-pro`. Always returns a result.

---

### **STEP 7 — De-tokenization & Action Execution**
📍 *File: `extension/src/background/index.js` → `detokenizeValue()`*

The server returns `"value": "<LOCAL_SECRET_1>"`.

Before the extension types anything, it runs:
```javascript
function detokenizeValue(val) {
  // <LOCAL_SECRET_1> → "john@gmail.com"
  for (const [token, secret] of localVault.entries()) {
    resolved = resolved.split(token).join(secret);
  }
  return resolved;
}
```

Then sends `EXECUTE_ACTION` to the content script:
```javascript
// Content script types the REAL email into the field
element.value = "john@gmail.com";  // never went to server!
element.dispatchEvent(new InputEvent('input'));
```

---

### **STEP 8 — Session Logging & Dashboard**
📍 *File: `web/src/lib/services/analyze.service.ts` → `logSession()`*

After each cycle, the server logs to **MongoDB**:
- What page was visited
- What PII was detected
- What action was taken
- Latency metrics
- Redacted thumbnail → uploaded to **Cloudinary** CDN

The **Dashboard** (`/dashboard`) shows:
- Total sessions run
- Average latency
- Total PII items redacted
- Provider usage (which Gemini model was used)
- Per-session step-by-step replay with thumbnails

---

### **STEP 9 — Loop Until Done**

After action executes, the background worker waits 1.5 seconds (page settle time) then loops back to STEP 1. Each cycle:

- Guardrails prevent infinite loops:
  - Max 10 actions per session
  - Same action repeated 3 times → stop
  - Form submitted → auto-stop next cycle

---

## 🏗️ Architecture: Who Talks to Whom

```
[User types task in Sidepanel]
        │
        ▼
[Background Service Worker]  ←──────────────────────────┐
  • Tokenizes credentials                                 │
  • Runs the agent loop (every ~2s)                      │
  • Orchestrates all steps                               │
        │                                                │
        ├──→ [Content Script] (injected in webpage)      │
        │      • DOM extraction                          │
        │      • PII detection (3 detectors)             │
        │      • Canvas redaction                        │
        │      • Action execution (click/type)           │
        │                                                │
        ├──→ [Sidepanel UI] (broadcasts status)         │
        │      • Shows "CLICK: Sign In button" messages  │
        │                                                │
        └──→ [Next.js API: /api/v1/analyze]             │
                 │                                       │
                 ├──→ [Analyze Service]                  │
                 │      • History tracking               │
                 │      • Guardrails                     │
                 │      • Prompt builder                 │
                 │                                       │
                 ├──→ [Gemini Provider]                  │
                 │      • Sends to Gemini API            │
                 │      • Multi-model cascade            │
                 │                                       │
                 ├──→ [MongoDB] (async, non-blocking)   │
                 │      • Session logs                   │
                 │                                       │
                 └──→ Response: {action, selector} ─────┘
                         (sent back to background worker)
```

---

## 🔑 The 5 "Wow" Technical Innovations

### 1. **Local Privacy Vault**
Passwords never leave your device. Server sees `<LOCAL_SECRET_2>`, your device substitutes the real value before typing.

### 2. **On-Device Multi-Modal Detection**
Three AI models (MediaPipe face detection, Tesseract OCR, DOM analysis) run as WebAssembly **inside your browser tab** — zero network calls for detection.

### 3. **DOM-Grounded Actions (No hallucination)**
Instead of letting the AI guess what to click from pixels, we extract exact CSS selectors from the live DOM and give them to the AI. It uses those exact selectors — zero guessing.

### 4. **Multi-Model Cascade**
If one Gemini model is rate-limited or down, silently tries the next one. The agent never fails due to API limits.

### 5. **Agentic Loop with Guardrails**
Autonomous multi-step execution with built-in safety: step limit (10 max), loop detection (same action 3x = stop), form submission detection (stop after submit).

---

## 💡 The Simplest Analogy

> Imagine you want to log into your bank but you're using a **translator** who doesn't speak English. You write your credentials in a secret code on a sticky note, give the translator a **blurred photo** of your screen, and they tell you "click button #4". You then use your sticky note to know what to actually type. The translator (cloud AI) never saw the real password.

That's Aavaran.

---

## 📁 File Map (Quick Reference)

| What you're looking for | File |
|---|---|
| Agent loop (main brain) | `extension/src/background/index.js` |
| UI the user types task into | `extension/src/ui/sidepanel/sidepanel.js` |
| Face detection | `extension/src/ai/detectors/face.detector.js` |
| OCR text detection | `extension/src/ai/detectors/ocr.detector.js` |
| Black-box drawing on canvas | `extension/src/privacy/redaction/` |
| API endpoint (receives requests) | `web/src/app/api/v1/analyze/route.ts` |
| Core analysis logic + history | `web/src/lib/services/analyze.service.ts` |
| Gemini AI + fallback cascade | `web/src/lib/providers/gemini.provider.ts` |
| System prompt engineering | `web/src/lib/constants/prompts.ts` |
| MongoDB models | `web/src/lib/db/models/` |
| Dashboard UI | `web/src/app/(dashboard)/dashboard/page.tsx` |
| Credential tokenizer | `background/index.js` → `tokenizeTaskLocally()` |
| Credential de-tokenizer | `background/index.js` → `detokenizeValue()` |
