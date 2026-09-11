# 🛡️ AAVARAN: Complete Project & Technical Architecture Guide
**Smart India Hackathon 2026 | Team: Stack Pirates**

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [High-Level Architecture & Visual Sequence Flow](#2-high-level-architecture--visual-sequence-flow)
3. [The 4 On-Device Extractors (Deep Dive)](#3-the-4-on-device-extractors-deep-dive)
4. [The 4 Architectural Layers](#4-the-4-architectural-layers)
5. [End-to-End Step-by-Step Data Journey](#5-end-to-end-step-by-step-data-journey)
6. [Multi-Model VLM Cascade & Failover Strategy](#6-multi-model-vlm-cascade--failover-strategy)
7. [Local Privacy Vault & Tokenization Mechanism](#7-local-privacy-vault--tokenization-mechanism)
8. [Complete Technology Stack Breakdown](#8-complete-technology-stack-breakdown)
9. [Judge Q&A: Comprehensive Technical Defenses](#9-judge-qa-comprehensive-technical-defenses)

---

## 1. Executive Summary & Problem Statement

### 🚨 The Problem: The Privacy Dilemma of AI Browser Agents
Autonomous web agents (e.g., Computer Use agents) interact with web applications by capturing screenshots and raw DOM trees, transmitting them directly to cloud-hosted Vision-Language Models (VLMs). 
This creates serious vulnerabilities:
* **Biometric & Face Leakage:** Webcams, profile photos, and avatars are transmitted to third-party cloud servers.
* **PII (Personally Identifiable Information) & Financial Exposure:** Aadhaar numbers, PAN cards, credit/debit card numbers, CVVs, phone numbers, and addresses rendered on screen are sent in plaintext/pixels to AI providers.
* **Credential Infiltration:** Passwords, API tokens, and session secrets are visible to model training pipelines and backend logs.

### 💡 The Solution: Aavaran
**Aavaran** (meaning *"Shield"* or *"Cover"*) is a privacy-first, on-device autonomous browser agent. It enforces a strict **Zero-Knowledge Client-Side Security Boundary**:
* Sensitive data detection and visual redaction happen **100% locally inside the browser sandbox** using WebAssembly.
* Cloud VLMs receive **only sanitized, masked pixels and abstracted DOM tokens**.
* Credentials are de-tokenized and injected **strictly on the client machine** during final event execution.

---

## 2. High-Level Architecture & Visual Sequence Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CLIENT-SIDE SECURITY BOUNDARY (100% On-Device)                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [1. USER TASK] ──> "Login with admin@aavaran.ai and password MySecretPass"            │
│          │                                                                             │
│          ▼                                                                             │
│  [2. LOCAL VAULT] ──> Tokenizes Credentials:                                           │
│                       "Login with {{VAULT_USER_1}} and password {{VAULT_PASS_1}}"      │
│          │                                                                             │
│          ▼                                                                             │
│  [3. CAPTURE] ──> Viewport Screenshot + Raw DOM Tree                                   │
│          │                                                                             │
│          ▼                                                                             │
│  [4. ON-DEVICE WASM DETECTORS] (Runs Parallel)                                         │
│       ├── MediaPipe    ──> Detects Faces / Avatars                                     │
│       ├── Tesseract.js ──> Detects Rendered Graphic Text                               │
│       ├── Regex Match  ──> Detects Aadhaar, PAN, Cards, Phone, Email                   │
│       └── DOM Grounder ──> Extracts Top 60 Actionable Inputs & Buttons                 │
│          │                                                                             │
│          ▼                                                                             │
│  [5. CANVAS REDACTION] ──> Paints Blackout Masks on Pixels                             │
│                            Destroys Unmasked Original in RAM                           │
│                                                                                        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            │ 🔒 HTTPS (Sanitized Image + Safe DOM + Tokens)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CLOUD REASONING LAYER (Next.js 14 Gateway)                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [6. MULTI-MODEL VLM CASCADE]                                                          │
│       ├── Tier 1: Google Gemini 2.5 Flash / Flash Lite                                 │
│       ├── Tier 2: Mistral AI (Pixtral-12B)                                             │
│       └── Tier 3: Local Ollama (llama3.2-vision)                                       │
│          │                                                                             │
│          ▼                                                                             │
│  [7. STRUCTURED JSON DIRECTIVE]                                                        │
│       { "action": "type", "elementId": 14, "value": "{{VAULT_PASS_1}}" }               │
│                                                                                        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            │ ⚡ Returns Action Directive
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        LOCAL SECURE EXECUTION & OBSERVABILITY                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [8. LOCAL DE-TOKENIZATION] ──> Swaps {{VAULT_PASS_1}} with "MySecretPass" in RAM      │
│          │                                                                             │
│          ▼                                                                             │
│  [9. SYNTHETIC EVENT DISPATCH] ──> Native focus, input, and change events on webpage   │
│          │                                                                             │
│          ▼                                                                             │
│  [10. TELEMETRY & AUDIT] ──> MongoDB (session metrics) + Cloudinary (redacted trace)   │
│          │                                                                             │
│          └─── (Loop repeats to Next Cycle until Goal is Achieved) ────────────────────┘
```

### 🔁 Sequence Flow Matrix

| Phase | Step | Actor / Module | Action Performed | Data Handled |
|---|---|---|---|---|
| **Input** | **1** | User & SidePanel | Submits natural language task | Plain text command |
| **Privacy** | **2** | Local Vault | Scans and tokenizes sensitive credentials | Secret $\rightarrow$ `{{TOKEN}}` |
| **Capture** | **3** | Content Script | Captures current viewport & DOM tree | Raw pixels & raw DOM |
| **Detect** | **4** | MediaPipe & Tesseract | Locates faces, PII, and rendered text | Coordinate bounding boxes |
| **Mask** | **5** | HTML5 Canvas | Draws opaque black boxes over sensitive areas | Masks pixels; deletes original |
| **Transit** | **6** | Network (HTTPS) | Dispatches payload to `/api/v1/analyze` | Masked image + Tokens |
| **Reason** | **7** | Cloud VLM Cascade | Multimodal reasoning on safe visual data | Returns JSON action plan |
| **Execute** | **8** | Content Script | De-tokenizes locally and dispatches DOM event | Real value injected into DOM |
| **Audit** | **9** | Observability | Logs execution status to Dashboard | Sanitized session metrics |

---

## 3. The 4 On-Device Extractors (Deep Dive)

The system coordinates **4 specialized extractors** executing in parallel on the client machine prior to any network packet dispatch:

```
                               ┌────────────────────────────────────────────────────────┐
                               │                 ON-DEVICE EXTRACTOR SUITE              │
                               └──────────────────────────┬─────────────────────────────┘
                                                          │
          ┌──────────────────────────┬────────────────────┴───────────────┬─────────────────────────┐
          │                          │                                    │                         │
          ▼                          ▼                                    ▼                         ▼
┌──────────────────┐       ┌──────────────────┐                 ┌──────────────────┐      ┌──────────────────┐
│   1. MediaPipe   │       │ 2. Tesseract.js  │                 │  3. Regex Engine │      │  4. DOM Grounder │
│  Face Detection  │       │  WASM OCR Engine │                 │  Pattern Matcher │      │  Element Priorit │
└─────────┬────────┘       └─────────┬────────┘                 └─────────┬────────┘      └─────────┬────────┘
          │                          │                                    │                         │
          ▼                          ▼                                    ▼                         ▼
   Biometric Faces            Rendered Graphic                    Aadhaar, PAN, Card,        Top 60 Clickable
   & Profile Images                 Text                           Emails, Phone, PII*        Inputs & Buttons
                                                                 *(Personally Identifiable)
```

### 1️⃣ Biometric Face Detector (Google MediaPipe WASM)
* **Technology:** Google MediaPipe Face Detection compiled to WebAssembly.
* **Mechanism:** Evaluates screenshot pixel tensors entirely inside the browser's JavaScript sandbox. Detects single/multiple human faces, profile photos, and avatars.
* **Output:** Geometric bounding boxes `[x, y, width, height]`.
* **Purpose:** Blocks biometric identification data from reaching cloud LLM logs and storage.

### 2️⃣ Optical Character Recognition Engine (Tesseract.js WASM)
* **Technology:** Tesseract.js (C++ Tesseract engine cross-compiled to WebAssembly with Web Workers).
* **Mechanism:** Scans image pixels to recognize alphanumeric characters burned into banners, watermarks, dynamic charts, and non-DOM graphical text.
* **Output:** Recognized words along with pixel-level coordinate vectors.
* **Purpose:** Catches sensitive text embedded in raster graphics that cannot be found in standard HTML DOM.

### 3️⃣ PII (Personally Identifiable Information) & Financial Regex Pattern Matcher
* **Technology:** High-throughput client-side Regex Pipeline.
* **Pattern Database:**
  * **Aadhaar Numbers:** 12-digit Indian National ID validation with Verhoeff checksum inspection.
  * **PAN Cards:** 10-character alphanumeric Indian Tax ID (`[A-Z]{5}[0-9]{4}[A-Z]{1}`).
  * **Payment Cards:** 16-digit Visa/Mastercard/RuPay card formats with Luhn Algorithm verification.
  * **CVV & Expiry:** 3/4-digit card verification codes.
  * **Contact Data:** Standard RFC 5322 Email patterns and E.164 phone numbering.
* **Purpose:** Immediate redaction coordinates for structured textual identifiers.

### 4️⃣ DOM Grounding & Interactive Tree Walker
* **Technology:** Custom JavaScript TreeWalker + Spatial Geometry Engine.
* **Mechanism:**
  * Traverses active DOM elements, calculating bounding rectangles (`getBoundingClientRect()`).
  * Assigns unique numeric identifiers (`elementId`).
  * **Noise Filtering:** Discards non-interactive elements, decorative SVG icons, repetitive header navigation links, and footer directories.
  * **Priority Sorting:** Form inputs (`<input>`, `<textarea>`, `<select>`) and primary submission buttons (`<button>`, `[role="button"]`) receive top priority.
  * **Context Cap:** Constrains payload to the top 60 most relevant viewport elements to prevent VLM context flooding.

---

## 4. The 4 Architectural Layers

### Layer 1: Client Extension Runtime (Chrome Manifest V3)
* **SidePanel (`sidepanel.html` & `sidepanel.js`):** Glassmorphic user dashboard providing natural language goal input, real-time action feed, execution pause/stop controls, and visual privacy toggles.
* **Background Service Worker (`background/index.js`):** Handles extension lifecycle, tab coordination, asynchronous message routing, and screenshot capture via `chrome.tabs.captureVisibleTab`.
* **Content Script (`content/index.js`):** Injected directly into active web pages. Executes the 4 Extractors, runs the HTML5 Canvas masking, and dispatches native browser events.

### Layer 2: Zero-Knowledge Redaction & Privacy Engine
* **Pixel Masking Engine:** Draws captured viewport onto an in-memory `<canvas>` element. Overlays solid black rectangles or Gaussian blur filters over all coordinates flagged by the extractors.
* **Sanitized Serialization:** The raw unredacted image is immediately freed from memory (`garbage collected`). Only the masked Base64 string is ever packaged into the network request.

### Layer 3: Backend & AI Orchestration Gateway (Next.js 14 App Router)
* **API Gateway (`/api/v1/analyze`):** Validates inbound payloads, handles rate limiting, and formats grounding prompts with strict structural schema constraints.
* **Multi-Provider Cascade:** Manages real-time routing across Google Gemini, Mistral AI, and local Ollama nodes.
* **Response Normalization:** Parses, validates, and normalizes AI outputs into strongly typed JSON directives.

### Layer 4: Persistence & Observability Layer
* **MongoDB Atlas + Mongoose:** Stores session metadata, latency metrics, step histories, and success rates.
* **Cloudinary CDN:** Securely hosts redacted visual execution frames for user audit trails and session replays.

---

## 5. End-to-End Step-by-Step Data Journey

### Step 1: User Submits Goal
* User enters: `"Sign into my AWS Console with user admin@company.com and secret P@ssw0rd99!"`.

### Step 2: Client-Side Vault Interception
* The Local Privacy Vault scans the input against local vault storage:
  * `admin@company.com` $\rightarrow$ `{{VAULT_USER_1}}`
  * `P@ssw0rd99!` $\rightarrow$ `{{VAULT_SECRET_1}}`
* Prompt transformed to: `"Sign into my AWS Console with user {{VAULT_USER_1}} and secret {{VAULT_SECRET_1}}"`.

### Step 3: Viewport & DOM Capture
* Extension captures visible screen: `data:image/jpeg;base64,...`
* DOM Walker extracts top 60 interactive elements with coordinates and accessibility labels.

### Step 4: Parallel On-Device Extraction
* MediaPipe locates 1 avatar face at `[x: 1120, y: 15, w: 40, h: 40]`.
* Regex engine locates a phone number on page footer at `[x: 450, y: 890, w: 120, h: 20]`.

### Step 5: Canvas Masking
* Canvas engine paints solid `#000000` over both regions.
* Raw unmasked image is discarded.

### Step 6: Transit to Backend
* HTTPS POST sent to Next.js API with:
  * `screenshot`: Masked Base64 image
  * `domElements`: Cleaned JSON list of interactive elements
  * `userPrompt`: Tokenized task directive

### Step 7: VLM Cascade & Multimodal Reasoning
* Google Gemini 2.5 Flash inspects the screenshot and DOM context.
* It identifies `elementId: 7` as the username input field.
* Generates JSON:
  ```json
  {
    "thought": "Focusing on username field to type credential token.",
    "action": "type",
    "elementId": 7,
    "value": "{{VAULT_USER_1}}",
    "completed": false
  }
  ```

### Step 8: Local De-Tokenization & Synthetic Dispatch
* Content script receives response.
* Finds target element via `elementId: 7`.
* Queries Vault: `{{VAULT_USER_1}}` $\rightarrow$ `admin@company.com`.
* Simulates trusted user input:
  1. `element.focus()`
  2. `element.value = "admin@company.com"`
  3. `element.dispatchEvent(new Event('input', { bubbles: true }))`
  4. `element.dispatchEvent(new Event('change', { bubbles: true }))`

### Step 9: Agentic Cycle Repeat
* New screen captured, verified, and next step executed until `"completed": true`.

---

## 6. Multi-Model VLM Cascade & Failover Strategy

To ensure uninterrupted uptime during hackathon demos and production workloads, Aavaran implements a **3-Tier Cascade Architecture**:

```
                       ┌────────────────────────────────────────┐
                       │       INCOMING ANALYZE REQUEST         │
                       └───────────────────┬────────────────────┘
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │   TIER 1: Primary Google Gemini        │
                       │   • gemini-2.5-flash (ultra-fast)      │
                       │   • gemini-2.5-flash-lite (low latency)│
                       │   • gemini-flash-latest (fallback)     │
                       └───────────────────┬────────────────────┘
                                           │
                        [HTTP 429 / Rate Limit / Timeout Fail]
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │   TIER 2: Mistral AI (Pixtral-12B)     │
                       │   High-precision multimodal vision     │
                       └───────────────────┬────────────────────┘
                                           │
                               [Network / API Fail]
                                           │
                                           ▼
                       ┌────────────────────────────────────────┐
                       │   TIER 3: Local Ollama (llama3.2-vision)│
                       │   100% Offline / Air-Gapped Fallback   │
                       └────────────────────────────────────────┘
```

---

## 7. Local Privacy Vault & Tokenization Mechanism

```
  ┌─────────────────────────┐                        ┌─────────────────────────┐
  │  Client Chrome Storage  │                        │   Cloud AI Provider     │
  │  (Encrypted AES-GCM-256)│                        │    (Gemini/Mistral)     │
  └────────────┬────────────┘                        └────────────┬────────────┘
               │                                                  │
               │ Local Vault Table                                │ AI Only Sees Tokens:
               │ • {{PASS_1}} ➔ "MySecretPassword!"               │ • "type {{PASS_1}}"
               │ • {{PIN_1}}  ➔ "884192"                          │ • "click #submit"
               │                                                  │
               └───────────────┬──────────────────────────────────┘
                               │
                               ▼
               [In-Memory Swapping on DOM Event]
```

* **Zero Cloud Exposure:** Passwords, API keys, and sensitive tokens are never serialized into HTTP payloads.
* **Deterministic Replacement:** The AI reasons with tokens as abstract variables, allowing full logical task completion without knowing the underlying sensitive value.

---

## 8. Complete Technology Stack Breakdown

| Layer / Domain | Technology | Specific Purpose |
|---|---|---|
| **Client Core** | Chrome Extension (Manifest V3) | Modern browser integration standard |
| **Client Language** | Modern JavaScript (ES2022) | Native, high-performance browser execution |
| **Bundler** | esbuild | Sub-second zero-overhead bundling |
| **On-Device Vision** | Google MediaPipe (WASM) | Client-side biometric face detection |
| **On-Device OCR** | Tesseract.js (WASM) | Client-side graphical character recognition |
| **Backend Framework** | Next.js 14 (App Router) + TypeScript | Type-safe API gateway & service orchestration |
| **Primary VLM** | Google Gemini 2.5 Flash / 1.5 Pro | High-speed multimodal screen reasoning |
| **Secondary VLM** | Mistral AI (`pixtral-12b`) | Multi-provider fallback resilience |
| **Edge VLM** | Ollama (`llama3.2-vision`) | Air-gapped / offline reasoning fallback |
| **Database** | MongoDB Atlas + Mongoose ODM | Telemetry, session state, audit logs |
| **Media CDN** | Cloudinary | Redacted visual trace storage |

---

## 9. Judge Q&A: Comprehensive Technical Defenses

### 💬 Q1: "Why did you build an on-device redaction layer instead of running a small VLM completely on the user's browser?"
> **Technical Defense:**  
> *"Browser-based local VLMs (such as WebLLM running Phi-3.5 or Llama-Vision via WebGPU) require between 4GB to 8GB of dedicated GPU VRAM, have 15 to 30-second inference latencies per step, and frequently crash browser tab memory limits.  
> In contrast, our WebAssembly extractors (MediaPipe + Tesseract) consume **less than 150MB RAM and execute in under 300ms**. By pairing ultra-lightweight on-device redaction with ultra-fast cloud VLMs (Gemini 2.5 Flash at ~600ms latency), we achieve **sub-second agent response loops with 100% mathematical privacy guarantees**."*

---

### 💬 Q2: "How do you guarantee that zero PII (Personally Identifiable Information) leaks over the network if a regex or OCR model misses something?"
> **Technical Defense:**  
> *"We implement a **Defense-in-Depth Privacy Architecture** across 3 distinct verification barriers:  
> 1. **Multi-Model Redaction:** MediaPipe flags pixel coordinates for biometric data, Tesseract flags rasterized text, and DOM Regex catches raw strings.  
> 2. **Tokenization Vault:** Real user credentials never reach the prompt pipeline; they are converted to surrogate tokens (`{{TOKEN}}`) before screen capture.  
> 3. **Canvas Pixel Zeroing:** The redaction is destructive—we draw opaque blackout boxes directly onto the pixel buffer and destroy the original screenshot reference in memory before serialization. If data is masked on canvas, it is mathematically impossible for the cloud server to reconstruct."*

---

### 💬 Q3: "What happens if Google Gemini goes down or hits API quota during an active workflow?"
> **Technical Defense:**  
> *"Our backend `analyze.service.ts` features an automated **3-Tier Cascade**:  
> * It attempts `gemini-2.5-flash`.  
> * Upon a `429 (Rate Limit)` or `503 (Unavailable)`, it immediately falls back to `gemini-2.5-flash-lite`, then `gemini-flash-latest`.  
> * If the Google Generative AI gateway is unreachable, it seamlessly switches providers to **Mistral AI's Pixtral-12B**.  
> * In an offline or intranet enterprise deployment, it routes to a local **Ollama** endpoint. The agent session continues without crashing."*

---

### 💬 Q4: "How does Aavaran handle dynamic single-page apps (SPAs) where DOM elements change after clicking?"
> **Technical Defense:**  
> *"Aavaran operates on a **Closed-Loop Agentic Cycle**. After executing an action, the agent does not guess the next state—it pauses, waits for DOM mutation settlement, captures a fresh viewport screenshot and DOM snapshot, and reassesses the page state. This makes it resilient against AJAX updates, dynamic popups, modals, and route transitions."*

---

### 💬 Q5: "How did you solve issues like agent clicking sidebars or infinite scrolling?"
> **Technical Defense:**  
> *"We implemented strict **DOM Grounding Heuristics**:  
> * We filter out redundant navigational header/sidebar `<a>` links when form elements are present.  
> * We enforce element prioritization: `input` and `button` elements are sorted to the top of the context window.  
> * We cap the DOM context to the top 60 actionable elements in the active viewport with spatial coordinate validation."*

---

**© 2026 Team Stack Pirates | Smart India Hackathon**
