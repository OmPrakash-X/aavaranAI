# 🛡️ Aavaran Extension — Production Documentation & Architecture Guide

> **Client-Side Edge AI Browser Extension for Privacy-Preserving Vision Agents**  
> *Compliant with Chrome MV3 & Firefox MV2 | WebGPU & WASM Accelerated | 100% On-Device PII Redaction*

---

## 📑 Table of Contents
1. [Overview & Architectural Philosophy](#1-overview--architectural-philosophy)
2. [Directory Structure](#2-directory-structure)
3. [Manifest & Multi-Browser Support (Chrome MV3 & Firefox MV2)](#3-manifest--multi-browser-support)
4. [Build System & Asset Pipeline (`build.js`)](#4-build-system--asset-pipeline)
5. [The 5-Layer AI Pipeline](#5-the-5-layer-ai-pipeline)
   - [Layer 0: CLIP ViT-B/32 Screen Classifier](#layer-0-clip-vit-b32-screen-classifier)
   - [Layer 1: Rule-Based DOM Detector](#layer-1-rule-based-dom-detector)
   - [Layer 2: Tesseract.js OCR Detector](#layer-2-tesseractjs-ocr-detector)
   - [Layer 3: BERT-NER Named Entity Detector](#layer-3-bert-ner-named-entity-detector)
   - [Layer 4: MediaPipe BlazeFace Face Detector](#layer-4-mediapipe-blazeface-face-detector)
   - [Pipeline Fusion & Detector Gating](#pipeline-fusion--detector-gating)
6. [Canvas Redaction Engine](#6-canvas-redaction-engine)
7. [Privacy Vault & Credential Tokenizer](#7-privacy-vault--credential-tokenizer)
8. [Agent Loop & Action Executor](#8-agent-loop--action-executor)
9. [User Interface (Popup & Side Panel)](#9-user-interface-popup--side-panel)
10. [Live Screen-Share & Recording Shield (Google Meet Safe)](#10-live-screen-share--recording-shield)
11. [Local Asset Management & Offline Models](#11-local-asset-management--offline-models)
12. [Developer Commands & Build Workflow](#12-developer-commands--build-workflow)
13. [Troubleshooting & Verification Guide](#13-troubleshooting--verification-guide)

---

## 1. Overview & Architectural Philosophy

The **Aavaran Browser Extension** serves as the autonomous, privacy-enforcing frontend agent for the Aavaran platform. Under SIH Problem Statement 26171 (*"On-device Visual Perception for Light-weight Browser Agents"*), the client device is strictly responsible for:

1. **Perceiving the User's Screen**: Capturing visual viewport state and interactive DOM structure.
2. **Executing Edge AI Inference**: Classifying page intent and pinpointing Personally Identifiable Information (PII) entirely locally using WebGPU and WebAssembly.
3. **Hard Anonymization Prior to Egress**: Obfuscating sensitive screen pixels (passwords, credit cards, Aadhaar, PAN, faces) and tokenizing secrets so **zero unmasked sensitive data ever leaves the user's browser**.
4. **Action Execution**: Faithfully executing high-level browser actions (click, type, scroll, navigate) returned by the upstream Vision-Language Model (VLM).

```
   ┌──────────────────────────────────────────────────────────────────┐
   │                        USER'S BROWSER                            │
   │                                                                  │
   │  ┌─────────────────┐       ┌──────────────────────────────────┐  │
   │  │ Web Page (Tab)  │ ───▶  │ Screen Classifier (CLIP ViT)     │  │
   │  └─────────────────┘       └─────────────────┬────────────────┘  │
   │           │                                  │                   │
   │           ▼                         Gated Execution              │
   │  ┌─────────────────┐                         │                   │
   │  │   Capture Tab   │       ┌─────────────────┴────────────────┐  │
   │  │   Screenshot    │ ───▶  │ 4-Layer Detector Cascade         │  │
   │  └─────────────────┘       │ (DOM + OCR + NER + Face)         │  │
   │                            └─────────────────┬────────────────┘  │
   │                                              │ Bounding Boxes    │
   │                                              ▼                   │
   │                            ┌──────────────────────────────────┐  │
   │                            │ Canvas Redaction Engine          │  │
   │                            │ (DPI-Aware Blur, Blackout, Mask) │  │
   │                            └─────────────────┬────────────────┘  │
   │                                              │ Sanitized Image   │
   │                                              ▼                   │
   │  ┌─────────────────┐       ┌──────────────────────────────────┐  │
   │  │ Action Executor │ ◀───  │ Privacy Vault (Tokenization)     │  │
   │  └─────────────────┘       └─────────────────┬────────────────┘  │
   └───────────▲──────────────────────────────────┼───────────────────┘
               │ JSON Browser Action              │ Sanitized Screenshot + DOM
               │                                  ▼
   ┌───────────┴──────────────────────────────────────────────────────┐
   │                     UPSTREAM VLM SERVER                          │
   │          (Next.js Backend / Gemini / Mistral / Ollama)           │
   └──────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
extension/
├── assets/
│   ├── icons/                   # Extension icons (16, 32, 48, 128 px PNG)
│   └── models/
│       ├── blaze_face_short_range.tflite   # 230KB MediaPipe face model
│       └── tesseract/
│           ├── eng.traineddata.gz          # 10.9MB compressed Tesseract model
│           └── eng.traineddata             # Decompressed language model
├── dist/                        # Production build output (loaded in browser)
├── lib/                         # Bundled edge AI WASM / ESM runtimes
│   ├── tesseract-core-simd.wasm.js         # SIMD WASM core for Tesseract
│   ├── tesseract-worker.min.js             # Tesseract worker thread
│   ├── tesseract.min.js                    # Tesseract.js bundle
│   ├── transformers.min.js                 # Transformers.js (CLIP & BERT)
│   ├── vision_bundle.mjs                   # MediaPipe Vision Tasks package
│   └── wasm/                               # MediaPipe SIMD/No-SIMD WASM binaries
├── scripts/
│   └── download-models.js       # Offline asset fetcher script
├── src/
│   ├── ai/
│   │   ├── detectors/
│   │   │   ├── dom.detector.js        # Layer 1: Rule-based DOM scanner
│   │   │   ├── face.detector.js       # Layer 4: BlazeFace face detector
│   │   │   ├── ner.detector.js        # Layer 3: Transformers.js BERT-NER
│   │   │   ├── ocr.detector.js        # Layer 2: Tesseract OCR detector
│   │   │   └── screen-classifier.js   # Layer 0: Zero-shot CLIP classifier
│   │   └── pipeline/
│   │       └── index.js               # Pipeline orchestrator & IoU fusion
│   ├── background/
│   │   └── index.js                   # Service worker, Agent Loop, Tokenizer
│   ├── compat/
│   │   └── firefox-shim.js            # Gecko API bridge (chrome.* ➔ browser.*)
│   ├── constants/
│   │   └── index.js                   # Regex patterns, PII definitions, config
│   ├── content/
│   │   └── index.js                   # Content script, DOM extraction, Executor
│   ├── privacy/
│   │   └── redaction/
│   │       └── engine.js              # Canvas obfuscation strategies
│   └── ui/
│       ├── popup/                     # Toolbar popup (Status, GPU, Precision)
│       └── sidepanel/                 # 3-Tab deep inspect panel
├── styles/
│   └── content-styles.css       # Visual bounding box highlight styling
├── build.js                     # esbuild bundler and asset packager
├── manifest.json                # Chrome Manifest V3 specification
├── manifest_v2.json             # Firefox Manifest V2 specification
└── package.json                 # Node dependencies and scripts
```

---

## 3. Manifest & Multi-Browser Support

Aavaran satisfies the SIH requirement for multi-browser support by maintaining dual manifest architectures:

### Chrome Manifest V3 (`manifest.json`)
- **Service Worker**: Uses `src/background/index.js` as an ES Module background worker.
- **Side Panel API**: Direct integration via `chrome.sidePanel` for contextual debugging.
- **Content Security Policy**: `script-src 'self' 'wasm-unsafe-eval'; object-src 'self'` allowing local WASM compilation without remote code vulnerabilities.
- **Web Accessible Resources**: Grants content scripts sandboxed access to `lib/*` and `assets/models/*`.

### Firefox Manifest V2 (`manifest_v2.json`)
- **Background Scripts**: Array-driven scripts list `["compat/firefox-shim.js", "background/index.js"]`.
- **Sidebar Action**: Native Firefox `sidebar_action` mapped to `ui/sidepanel/sidepanel.html`.
- **Gecko ID Configuration**: Explicit ID `aavaran@privacyvision.ai` with `strict_min_version: "109.0"`.

### The Firefox Compatibility Shim (`src/compat/firefox-shim.js`)
Firefox implements the W3C WebExtensions standard with Promise-based `browser.*` APIs, whereas Chromium relies on callback-driven `chrome.*` patterns. The shim transparently bridges this gap:
```javascript
// Wraps Promise-based browser APIs to callback-based chrome.* methods
function wrapPromiseToCallback(fn) {
  return function (...args) {
    const callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    const result = fn(...args);
    if (result && typeof result.then === 'function') {
      result.then(
        (res) => callback && callback(res),
        (err) => {
          chrome.runtime.lastError = { message: err?.message || String(err) };
          if (callback) callback(undefined);
          delete chrome.runtime.lastError;
        }
      );
    } else if (callback) {
      callback(result);
    }
  };
}
```
It additionally polyfills `chrome.sidePanel` with a non-breaking no-op so background logic executes uniformly across both engines.

---

## 4. Build System & Asset Pipeline (`build.js`)

The extension utilizes `esbuild` to produce optimized, production-ready bundles inside the `dist/` directory.

### Key Build Operations
1. **Dynamic Path Rewriting**: Automatically strips `src/` prefixes from manifest content scripts, service worker, and popup definitions so the relative hierarchy in `dist/` matches extension runtime lookups.
2. **Firefox Manifest Transformation**: Transforms `manifest_v2.json` into `dist/manifest_v2.json`, resolving path discrepancies and omitting unneeded flags.
3. **Asset Uncompression**: Checks `assets/models/tesseract/eng.traineddata.gz` and automatically decompresses it into `eng.traineddata` via Node's `zlib.gunzipSync` if absent, ensuring both formats exist for offline loading.
4. **Bundle Compilation Targets**:
   - `content/index.js`: IIFE format (required because Chrome content scripts cannot run as native ES modules).
   - `background/index.js`: IIFE format for uniform service worker / script execution.
   - `ui/popup/popup.js` & `ui/sidepanel/sidepanel.js`: Standalone sandboxed bundles.

---

## 5. The 5-Layer AI Pipeline

Aavaran's edge intelligence operates as an orchestrated cascade combining rule-based heuristics with machine learning.

```
                    ┌────────────────────────────┐
                    │      Screen Captured       │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │  Layer 0: Screen Classifier │
                    │  (CLIP ViT-B/32 on WebGPU)  │
                    └─────────────┬──────────────┘
                                  │ Classifies Page Type
                                  ▼
                   ┌──────────────────────────────┐
                   │    Detector Gate Routing     │
                   └──────────────┬───────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │ (Login / Form)        │ (Doc / Article)       │ (Profile / ID)
          ▼                       ▼                       ▼
    ┌───────────┐           ┌───────────┐           ┌───────────┐
    │  Layer 1  │           │  Layer 2  │           │  Layer 4  │
    │    DOM    │           │    OCR    │           │ BlazeFace │
    │ (Instant) │           │(Tesseract)│           │ (5-10ms)  │
    └─────┬─────┘           └─────┬─────┘           └─────┬─────┘
          │                       │                       │
          │                       ▼                       │
          │                 ┌───────────┐                 │
          │                 │  Layer 3  │                 │
          │                 │ BERT-NER  │                 │
          │                 └─────┬─────┘                 │
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │  IoU Fusion & Redaction    │
                    └────────────────────────────┘
```

### Layer 0: CLIP ViT-B/32 Screen Classifier
- **Implementation**: [`screen-classifier.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/screen-classifier.js)
- **Engine**: Transformers.js with WebGPU acceleration (`device: 'webgpu'`, fallback to `'wasm'`).
- **Functionality**: Performs zero-shot image classification against 10 screen templates:
  `login_form`, `payment_form`, `profile_form`, `document_view`, `dashboard`, `email_client`, `settings_page`, `ecommerce_checkout`, `search_results`, `social_feed`.
- **Efficiency Impact**: Enables detector gating. If a page is classified as a pure `login_form`, heavy detectors like NER and Face Detection are disabled, cutting ~180ms off client latency.

### Layer 1: Rule-Based DOM Detector
- **Implementation**: [`dom.detector.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/dom.detector.js)
- **Latency**: `< 5ms` (0ms perception cost).
- **Functionality**: Scans interactive elements (`input`, `textarea`, `select`, `label`, `form`).
- **Patterns Detected**:
  - Direct HTML semantic types (`type="password"`, `type="email"`, `autocomplete="cc-number"`).
  - Indian-specific identifiers: Aadhaar (`^\d{4}\s\d{4}\s\d{4}$`), Permanent Account Number (PAN) (`^[A-Z]{5}[0-9]{4}[A-Z]$`).
  - Credit card numbers (Luhn compliant regex), Phone numbers (+91 Indian format), Dates of Birth.
- **Bounding Boxes**: Directly calculated via `element.getBoundingClientRect()` with scroll offset compensation.

### Layer 2: Tesseract.js OCR Detector
- **Implementation**: [`ocr.detector.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/ocr.detector.js)
- **Engine**: Tesseract.js v5 with SIMD WASM core (`tesseract-core-simd.wasm.js`).
- **Functionality**: Extracts rasterized text from captured screenshots (canvas, static images, rendered receipts).
- **PII Matching**: Runs word-level and multi-word regex passes across OCR text tokens, outputting absolute pixel bounding boxes (`{ x, y, width, height }`).

### Layer 3: BERT-NER Named Entity Detector
- **Implementation**: [`ner.detector.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/ner.detector.js)
- **Engine**: Quantized `Xenova/bert-base-NER` (`dtype: 'q8'`) executing on WebGPU/CPU.
- **Functionality**: Ingests candidate text tokens from Layer 2 (OCR) and detects contextual entities:
  - `B-PER` / `I-PER` (Individual names)
  - `B-ORG` / `I-ORG` (Organizations, banks)
  - `B-LOC` / `I-LOC` (Geographic addresses)

### Layer 4: MediaPipe BlazeFace Face Detector
- **Implementation**: [`face.detector.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/face.detector.js)
- **Model**: `blaze_face_short_range.tflite` (230KB).
- **Latency**: ~5-15ms under WebGPU delegate.
- **Functionality**: Detects user profile photos, passport thumbnails, video call previews, and ID badges on screen to prepare them for blur redaction.

### Pipeline Fusion & Detector Gating
- **Implementation**: [`pipeline/index.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/pipeline/index.js)
- **IoU Deduplication**: Calculates Intersection over Union across bounding boxes from all layers:
  $$\text{IoU}(A, B) = \frac{\text{Area}(A \cap B)}{\text{Area}(A \cup B)}$$
  If $\text{IoU} \ge 0.4$, detections are merged, retaining the highest confidence score and attributing the detection to composite layers.

---

## 6. Canvas Redaction Engine

- **Implementation**: [`engine.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/privacy/redaction/engine.js)
- **DPI-Aware Coordinate Clamping**: Accounts for `devicePixelRatio` differences between the CSS DOM viewport and native screenshot dimensions:
  $$\text{scaleX} = \frac{\text{canvas.width}}{\text{window.innerWidth}}, \quad \text{scaleY} = \frac{\text{canvas.height}}{\text{window.innerHeight}}$$
- **Padding**: Automatically extends 4px of extra border around bounding boxes to prevent edge bleed or haloing around text fields.

### Redaction Strategies

| Strategy | Target Data Type | Mechanism |
|---|---|---|
| `solid_fill` | Passwords, Aadhaar, PAN, Credit Cards | Solid black `#000000` rectangle drawn onto canvas. |
| `gaussian_blur` | Faces, Avatars, ID Badges | 8-iteration box blur approximation simulating Gaussian kernel over pixel region. |
| `pixelate` | Generic numeric fields, Captchas | Downsamples region into $8 \times 8$ blocks and blits back scaled up. |
| `char_mask` | Email addresses, Usernames | Renders asterisk sequences (`****@domain.com`) directly on top of coordinates. |

---

## 7. Privacy Vault & Credential Tokenizer

- **Implementation**: [`background/index.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/background/index.js)
- **Purpose**: Prevents real credentials from ever reaching the server while still enabling the VLM to execute login tasks.

### Tokenization Flow
1. When a user provides credentials (e.g. via prompt or local form interaction), secrets are stored in a local, encrypted in-memory session map.
2. In the extracted DOM sent to the VLM:
   - Password fields have their value masked to `"[REDACTED]"`.
3. If an action requires typing a password, the task description uses the token `<LOCAL_SECRET_PASSWORD>`.
4. When the server responds with:
   ```json
   { "action": "type", "selector": "#password", "value": "<LOCAL_SECRET_PASSWORD>" }
   ```
5. The client background worker detects the sentinel token, resolves the actual secret from local browser memory, and injects the real password into the DOM.

---

## 8. Agent Loop & Action Executor

### The Autonomous Multi-Cycle Loop
Located in `background/index.js`:
```
   Step 1: Capture screenshot & detect screen type
   Step 2: Run 4-layer AI pipeline ➔ generate redaction manifest
   Step 3: Redact screenshot on offscreen canvas
   Step 4: Extract interactive DOM elements (up to 60 priority elements)
   Step 5: Transmit sanitized bundle to POST /api/v1/analyze
   Step 6: Receive VLM action JSON
   Step 7: Content script executes action
   Step 8: Check loop detection / anti-runaway guard (max 10 steps)
   Step 9: If action != "done", repeat loop
```

### Action Executor (`src/content/index.js`)
Supports 7 standard browser actions with 5 fallback mechanisms:
1. `click`: Dispatches `pointerdown`, `mousedown`, `click`, `mouseup`.
2. `type`: Dispatches native setter descriptor overrides to trigger internal state updates in React, Vue, and Angular controlled inputs.
3. `scroll`: Directional scrolling (`up`, `down`) or scrolling directly into view.
4. `navigate`: Direct URL navigation.
5. `press_key`: Dispatches `KeyboardEvent` (`Enter`, `Tab`, `Escape`).
6. `wait`: Explicit pause for dynamic DOM mutations.
7. `done`: Terminates agent loop and displays completion status.

---

## 9. User Interface (Popup & Side Panel)

### Toolbar Popup (`src/ui/popup/`)
- **GPU Status Indicator**: Checks `navigator.gpu` dynamically; turns green with `"WebGPU Active"` or amber with `"WASM Mode"`.
- **6-Metric Overview Grid**:
  1. Total Detections
  2. Redactions Applied
  3. Cycle Latency
  4. Active Server Provider (Gemini / Mistral / Ollama)
  5. **Live Precision %**: Evaluates true positives vs false positives.
  6. **Live Recall %**: Evaluates detected sensitive items vs ground truth DOM targets.

### Deep Inspect Side Panel (`src/ui/sidepanel/`)
- **Tab 1: 💬 Agent**: Interactive conversational control, real-time step log, and execution status.
- **Tab 2: 📊 Performance**:
  - Live JS Heap Memory gauge via `performance.memory`.
  - Granular 6-bar pipeline timing breakdown:
    - CLIP ViT Classification (ms)
    - DOM Detector (ms)
    - OCR Engine (ms)
    - NER BERT (ms)
    - MediaPipe Face (ms)
    - Canvas Redaction (ms)
- **Tab 3: 🛡️ PII Stats**:
  - Detection breakdown by category (Password, Aadhaar, PAN, Credit Card, Email, Face).
  - Detection attribution by detector layer (DOM, OCR, NER, Face).

---

## 10. Live Screen-Share & Recording Shield (Google Meet Safe)

A dedicated, real-time privacy layer designed for **live presentations, Google Meet screen sharing, Zoom calls, and screen recordings**:

### How It Works
1. **Instant In-Page DOM Obfuscation**: When toggled ON from either the toolbar popup or the side panel, the `ScreenShield` engine executes directly within the active web page.
2. **Targets Real-Time Visual Data**:
   - **Sensitive Numbers**: Automatically identifies and blurs mobile phone numbers (`+91 ...`), Aadhaar numbers, PAN IDs, credit/debit card numbers, and financial bank balances.
   - **Authentication Secrets**: Blurs `type="password"`, OTP inputs, and secret fields.
   - **Profile Photos & Avatars**: Targets `img[src*="avatar"]`, `img[class*="profile"]`, user thumbnails, and portrait photos using `filter: blur(14px) grayscale(40%)`.
3. **Hover-to-Peek Interaction**: The presenter can temporarily unblur an item by hovering their mouse over it; moving the cursor away immediately re-blurs the data.
4. **Dynamic Mutation Observer**: Continuously monitors the DOM for single-page applications (Gmail, Twitter/X, GitHub, WhatsApp Web). As the user scrolls or new content loads, new numbers and profile pictures are masked in real time.
5. **Floating Security Badge**: Displays a subtle floating pill in the bottom corner of the webpage confirming `🛡️ Meet & Recording Shield Active` with a live count of shielded elements and quick toggle controls.

---

## 11. Local Asset Management & Offline Models

All model binaries are hosted within the extension package to ensure 100% offline capability:

```powershell
# Script to download all models into extension folder
cd extension
node scripts/download-models.js
```

### Bundled Assets Summary
- `lib/transformers.min.js`: Transformers.js CDN bundle.
- `lib/tesseract.min.js`, `tesseract-worker.min.js`, `tesseract-core-simd.wasm.js`: Full Tesseract WASM runtime.
- `lib/vision_bundle.mjs`, `lib/wasm/*`: MediaPipe Vision Tasks package.
- `assets/models/blaze_face_short_range.tflite`: BlazeFace model file.
- `assets/models/tesseract/eng.traineddata`: English OCR language dictionary.

---

## 12. Developer Commands & Build Workflow

All commands must be executed from `c:\Users\omnay\Desktop\Hackathons\aavaran\extension`:

### 1. Download Model Assets (First time setup)
```powershell
node scripts/download-models.js
```

### 2. Build Extension (Generates `dist/`)
```powershell
node build.js
```

### 3. Build in Watch Mode (For active UI / content script development)
```powershell
node build.js --watch
```

### 4. Load into Chrome
1. Open `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select `c:\Users\omnay\Desktop\Hackathons\aavaran\extension\dist`.

### 5. Load into Firefox
1. In `c:\Users\omnay\Desktop\Hackathons\aavaran\extension\dist`, copy `manifest_v2.json` to `manifest.json`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**.
4. Select the `dist/manifest.json` file.

---

## 13. Troubleshooting & Verification Guide

| Issue | Root Cause | Solution |
|---|---|---|
| `[OCR] Not initialized, skipping` | Missing Tesseract core or language pack | Verify `dist/lib/tesseract-core-simd.wasm.js` and `dist/assets/models/tesseract/eng.traineddata` exist. Re-run `node build.js`. |
| `[ScreenClassifier] WebGPU unavailable` | Browser does not support WebGPU or flag is off | Check `chrome://gpu`. The classifier automatically falls back to WASM without breaking. |
| Redaction boxes are shifted on screen | Display scaling (125%, 150%, 200%) | Verify `scaleX` and `scaleY` calculation in `engine.js`. |
| Firefox rejects `manifest_v2.json` | Syntax error or unsupported keys | Ensure `"type": "module"` is omitted from the background entry in `manifest_v2.json`. |
