# 🛡️ Aavaran AI (आवरण) — Privacy-Preserving Vision Browser Agent

<div align="center">

![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)
![Chrome MV3](https://img.shields.io/badge/Chrome-MV3%20Compatible-4285F4?logo=googlechrome&logoColor=white)
![Firefox MV2](https://img.shields.io/badge/Firefox-MV2%20Compatible-FF7139?logo=firefox&logoColor=white)
![WebGPU](https://img.shields.io/badge/Acceleration-WebGPU%20%7C%20WASM-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-16%2B%20App%20Router-black?logo=next.js&logoColor=white)
![Offline VLM](https://img.shields.io/badge/Offline%20VLM-Ollama%20Supported-purple)

**On-device visual perception that detects, redacts, and tokenizes sensitive data in the browser before sending sanitized visual context to Vision-Language Models.**

[Quick Start](#-quick-start) • [Architecture](#-system-architecture) • [Extension Guide](docs/EXTENSION.md) • [Server & Dashboard Guide](docs/WEB.md) • [SIH PS Alignment](#-sih-problem-statement-26171-alignment)

</div>

---

## 📑 Central Documentation Hub

For exhaustive technical guides, explore the dedicated documentation modules:

| Document | Purpose & Contents |
|---|---|
| 🧩 **[Extension Production Guide](docs/EXTENSION.md)** | Full guide for the Chrome MV3 & Firefox MV2 client extension, 5-layer AI pipeline, WebGPU zero-shot classifier, DPI-aware redaction engine, Privacy Vault tokenizer, and live UI dashboards. |
| 🌐 **[Web Server & Dashboard Guide](docs/WEB.md)** | Full guide for the Next.js 16+ App Router server, multi-VLM provider cascade (Gemini 1.5 Flash, Mistral Pixtral, local offline Ollama), database models, Cloudinary media pipeline, and real-time security dashboard. |
| 🎨 **[Liquid Glass Design System](docs/DESIGN.md)** | Comprehensive UI design language, liquid glass aesthetic, monochrome tokens, and visual accessibility. |

---

## 💡 The Problem & The Solution

### The Core Problem (SIH PS 26171)
Autonomous AI browser agents need visual context (screen captures) to automate complex digital workflows. However, sharing raw screens with cloud servers compromises user privacy by inadvertently leaking:
- Passwords and authentication credentials
- Government Identity Numbers (Aadhaar, PAN)
- Financial Data (Credit/Debit Card numbers, CVV)
- Personal contact information and biometric human faces

### The Aavaran Solution
**Aavaran (आवरण — "The Protective Shield")** introduces a **privacy-by-design edge architecture**:
1. **100% Client-Side Perception**: Runs lightweight computer vision and NLP models directly on the user's browser using **WebGPU** and **WebAssembly**.
2. **Hard Pixel Redaction Before Egress**: Obfuscates sensitive coordinates using solid blackouts, multi-pass Gaussian blurs, and mosaic pixelation directly on an offscreen HTML5 canvas.
3. **Privacy Vault & Credential Tokenization**: Masks secrets to tokens (`<LOCAL_SECRET_PASSWORD>`). The server commands the agent using the token; the local client injects the real password into the DOM.
4. **VLM Action Orchestration**: Upstream Vision-Language Models (Gemini, Mistral, or offline Ollama) receive **only sanitized imagery + DOM JSON**, returning structured browser actions (click, type, scroll, navigate) executed by the client.

---

## 🏗️ System Architecture

```
                                    USER'S LOCAL BROWSER
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                  │
    │   ┌────────────────────┐          ┌──────────────────────────────────────────┐   │
    │   │  Web Page (Active) │  ──────▶ │  Screen Classifier (CLIP ViT-B/32)       │   │
    │   └────────────────────┘          │  Classifies page type & gates detectors  │   │
    │             │                     └────────────────────┬─────────────────────┘   │
    │             ▼ Viewport Snapshot                        │                         │
    │   ┌────────────────────┐                               ▼ Dynamic Activation      │
    │   │ Capture Visible    │          ┌──────────────────────────────────────────┐   │
    │   │ Tab (Screenshot)   │  ──────▶ │  4-Layer Edge Detection Cascade          │   │
    │   └────────────────────┘          │  • Layer 1: DOM Scanner (<5ms, regex)   │   │
    │                                   │  • Layer 2: Tesseract OCR (WASM)         │   │
    │                                   │  • Layer 3: BERT-NER (quantized q8)      │   │
    │                                   │  • Layer 4: MediaPipe BlazeFace (faces)  │   │
    │                                   └────────────────────┬─────────────────────┘   │
    │                                                        │ Sensitive Bounding Boxes│
    │                                                        ▼                         │
    │   ┌────────────────────┐          ┌──────────────────────────────────────────┐   │
    │   │  Action Executor   │          │  Canvas Redaction Engine                 │   │
    │   │  (click, type,     │          │  (DPI-aware Blur, Blackout, Pixelate)    │   │
    │   │   scroll, etc.)    │          └────────────────────┬─────────────────────┘   │
    │   └─────────▲──────────┘                               │ Sanitized Pixels        │
    │             │ Real Password Injection                  ▼                         │
    │   ┌─────────┴──────────┐          ┌──────────────────────────────────────────┐   │
    │   │   Privacy Vault    │ ◀─────── │  Credential Tokenizer                    │   │
    │   │  (In-Memory Keys)  │          │  (Replaces secrets with Sentinel Tokens) │   │
    │   └────────────────────┘          └────────────────────┬─────────────────────┘   │
    └────────────────────────────────────────────────────────┼─────────────────────────┘
                                                             │ HTTPS POST
                                                             │ (Sanitized Image + DOM JSON)
                                                             ▼
                                             AAVARAN NEXT.JS SERVER
    ┌──────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                  │
    │   ┌──────────────────────────────────────────────────────────────────────────┐   │
    │   │  POST /api/v1/analyze                                                    │   │
    │   │  • In-memory action history & loop detection                             │   │
    │   │  • Anti-runaway guard (hard 10-step cap)                                 │   │
    │   │  • Redaction-aware system prompt synthesis                               │   │
    │   └────────────────────────────────────┬─────────────────────────────────────┘   │
    │                                        │                                         │
    │                                        ▼                                         │
    │   ┌──────────────────────────────────────────────────────────────────────────┐   │
    │   │  Multi-VLM Provider Cascade                                              │   │
    │   │  ┌────────────────────────┐  Failover  ┌────────────────────────┐  Offline   │
    │   │  │ Primary: Gemini 1.5    │ ─────────▶ │ Fallback: Mistral      │ ─────────┐ │
    │   │  │ Flash (Cloud, ~800ms)  │            │ Pixtral 12B (Cloud)    │          │ │
    │   │  └────────────────────────┘            └────────────────────────┘          │ │
    │   │                                                                            ▼ │
    │   │                                        ┌───────────────────────────────────┐ │
    │   │                                        │ Local / Offline: Ollama LLaVA     │ │
    │   │                                        │ (Zero API Cost, GPU Local)        │ │
    │   │                                        └───────────────────────────────────┘ │
    │   └────────────────────────────────────┬─────────────────────────────────────────┘
    │                                        │ Structured Action JSON                  │
    │                                        │ { action, selector, value, reasoning }  │
    │                                        ▼                                         │
    │   ┌──────────────────────────────────────────────────────────────────────────┐   │
    │   │  Persistence & Telemetry                                                 │   │
    │   │  • MongoDB Atlas: Full session telemetry, detector latency, manifests    │   │
    │   │  • Cloudinary CDN: Sanitized visual audit thumbnails                     │   │
    │   │  • Security Dashboard: Real-time latency, memory, and PII metrics       │   │
    │   └──────────────────────────────────────────────────────────────────────────┘   │
    └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 SIH Problem Statement 26171 Alignment

| SIH Metric | Weight | How Aavaran Solves It | Technical Proof Point |
|---|---|---|---|
| **1. Visual Context Accuracy** | **25%** | CLIP ViT-B/32 zero-shot classifier classifies page intent. Dual-input feeding (redacted screenshot + prioritized 60-element DOM JSON) gives the VLM perfect spatial and structural awareness. | `screen-classifier.js` (WebGPU) + `content/index.js` priority sorting. |
| **2. PII Recall & Precision** | **20%** | 4-layer cascade: DOM scanner (high precision, 0ms), Tesseract OCR (catches rasterized text), BERT-NER (catches named entities), and BlazeFace (catches human faces) with IoU deduplication. | Live Precision % and Recall % computed against DOM ground truth in sidepanel. |
| **3. Redaction Precision** | **20%** | DPI-aware canvas scaling (`scaleX`/`scaleY`), coordinate clamping, 4px edge padding, and specialized strategies (solid black for IDs/passwords, box blur for faces). | `engine.js` verifies zero unmasked sensitive pixels ever leave the browser. |
| **4. Client Resource Utilization** | **20%** | Detector gating skips unnecessary models based on screen type (saves ~180ms). Quantized models (`q8`), WASM fallbacks, and real-time JS heap memory tracking. | Sidepanel Performance tab tracks live RAM, WebGPU status, and 6-bar pipeline latencies. |
| **5. End-to-End Latency** | **15%** | Client perception: ~100-250ms with WebGPU. Server VLM round-trip: ~600-900ms (Gemini Flash). Pre-VLM local guards stop completed login flows without calling the server. | Real-time E2E cycle timer logged in DB and displayed live. |

---

## 📦 Repository Structure

```
aavaran/
├── docs/                        # Detailed production documentation
│   ├── EXTENSION.md             # Extension architecture, models, build guide
│   ├── WEB.md                   # Next.js App Router, APIs, VLM providers, DB
│   └── DESIGN.md                # Liquid Glass Monochrome UI design system
├── extension/                   # Client-side Browser Extension
│   ├── assets/models/           # BlazeFace TFLite & Tesseract traineddata
│   ├── lib/                     # Tesseract WASM, Transformers.js, MediaPipe
│   ├── src/ai/                  # 5-Layer AI Pipeline & Detectors
│   ├── src/background/          # Service worker, Agent Loop, Privacy Vault
│   ├── src/compat/              # Firefox Gecko compatibility shim
│   ├── src/content/             # Content script & Action executor
│   ├── src/privacy/redaction/   # DPI-aware Canvas Redaction Engine
│   ├── src/ui/                  # Popup & 3-Tab Live Inspect Sidepanel
│   ├── build.js                 # esbuild bundler and asset packager
│   ├── manifest.json            # Chrome MV3 specification
│   └── manifest_v2.json         # Firefox MV2 specification
├── web/                         # Server-Side Next.js 16+ Web Application
│   ├── src/app/api/v1/          # /analyze, /health, /metrics, /sessions
│   ├── src/app/(dashboard)/     # Real-time analytics, live stream, session audit
│   ├── src/lib/providers/       # Gemini, Mistral, and local Ollama adapters
│   ├── src/lib/services/        # Analyze service, loop detection, guardrails
│   └── src/lib/db/              # Mongoose schemas & MongoDB connection
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **Browser**: Google Chrome (v120+ with WebGPU enabled) or Mozilla Firefox (v109+)
- **MongoDB**: Local `mongod` instance or free MongoDB Atlas URI
- *(Optional)* **Ollama**: For 100% offline edge inference (`ollama pull llava`)

---

### Step 1: Clone and Configure Environment

```powershell
cd c:\Users\omnay\Desktop\Hackathons\aavaran\web
```

Verify or update your `.env.local` file:
```ini
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.vo0xyuz.mongodb.net/aavaran
GEMINI_API_KEY=your_gemini_api_key
VLM_PRIMARY_PROVIDER=gemini
VLM_FALLBACK_PROVIDER=mistral
```

---

### Step 2: Start the Web Server & Dashboard

```powershell
cd c:\Users\omnay\Desktop\Hackathons\aavaran\web
npm install
npm run dev
```

The Next.js server will start at:
- **Landing Page**: `http://localhost:3000`
- **Security Dashboard**: `http://localhost:3000/dashboard`
- **System Health Check**: `http://localhost:3000/api/v1/health`

---

### Step 3: Build the Browser Extension

In a separate terminal:

```powershell
cd c:\Users\omnay\Desktop\Hackathons\aavaran\extension

# 1. Download bundled offline edge AI models (only needed once)
node scripts/download-models.js

# 2. Build production bundles into dist/
node build.js
```

---

### Step 4: Load Extension in Browser

#### For Google Chrome (MV3):
1. Navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select `c:\Users\omnay\Desktop\Hackathons\aavaran\extension\dist`.

#### For Mozilla Firefox (MV2):
1. Inside `extension/dist`, rename or copy `manifest_v2.json` to `manifest.json`.
2. Navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**.
4. Select `extension/dist/manifest.json`.

---

## 🖥️ Live Testing & Judge Demonstration

### Recommended Demonstration Workflow:
1. Open any login or form page (e.g. `https://github.com/login` or a demo form with email, password, and Aadhaar/PAN fields).
2. Click the **Aavaran Shield Icon** in the browser toolbar:
   - Notice the **WebGPU Active** green badge.
   - Click **Open Side Panel** to view the live 3-tab inspector.
3. Switch to the **📊 Performance** tab in the sidepanel:
   - Observe live JS Heap Memory monitoring.
   - Note the detector timing breakdown bars (DOM, CLIP, OCR, Face, Redaction).
4. Enter an automation prompt in the **💬 Agent** tab:
   > *"Log into this page with username Puspa and my secret password."*
5. Click **Start Task**:
   - **Perception**: Bounding boxes highlight sensitive inputs.
   - **Redaction**: Blackout rectangles mask passwords; the snapshot sent to the server contains no plaintext credentials.
   - **Execution**: The agent types the username, fills the masked password via the Privacy Vault, and submits the form.
6. Open `http://localhost:3000/dashboard`:
   - Inspect the live session log, latency graph, and Cloudinary thumbnail showing the redacted screenshot.

### Demo 2: Live Screen-Share & Google Meet Shield
1. Open any page containing phone numbers, cards, or user profiles (e.g. GitHub profile, WhatsApp Web, or account settings).
2. Click the Aavaran extension icon and toggle **Screen-Share Shield** to **ON**.
3. Notice how **phone numbers, cards, passwords, and profile photos immediately blur live on the webpage**.
4. During Google Meet screen sharing, Zoom calls, or screen recordings, all sensitive data is shielded in real time!
5. Hover your cursor over any blurred item to peek at the value locally; it snaps back into protective blur as soon as your cursor leaves.
6. A floating pill in the bottom-right corner confirms `🛡️ Meet & Recording Shield Active` with a count of hidden items.

---

## 🛡️ Security & Privacy Guarantees

1. **Zero Raw Screen Egress**: Screenshots are redacted on an offscreen `<canvas>` before the JPEG data URL is constructed. The raw unredacted image is destroyed in local memory.
2. **Deterministic Credential Isolation**: Passwords are typed via the local content script descriptor setter using local browser state. Upstream VLMs receive only sentinel tokens (`<LOCAL_SECRET_PASSWORD>`).
3. **Local Auditability**: All detection manifests include confidence scores and detector attributions (`dom`, `ocr`, `ner`, `mediapipe`) accessible in the client sidepanel and server dashboard.
4. **Offline Resilience**: When internet access is disconnected, setting `VLM_PRIMARY_PROVIDER=ollama` routes requests to a local Ollama instance running LLaVA or MiniCPM-V, maintaining complete operational autonomy.

---

## 👥 Contributors & Acknowledgements

Developed for **Smart India Hackathon (SIH) — Problem Statement 26171**  
*"On-device Visual Perception for Light-weight Browser Agents"*

- **Team**: Aavaran AI
- **Core Stack**: WebGPU, Transformers.js, MediaPipe, Tesseract.js, Next.js 16, Tailwind CSS v4, Mongoose, Google Gemini, Mistral AI, Ollama.
