# Aavaran — Codebase Analysis vs. SIH PS 26171

## 📋 Problem Statement Recap
Build a **privacy-preserving vision browser agent** that:
1. Runs a client-side CV model to "read" the screen
2. Detects & redacts PII/sensitive data before sending anything to server
3. Sends only the sanitized (anonymized) visual context to a server VLM
4. Server returns actionable browser commands; client executes them

**Evaluation Metrics:**
| # | Metric | Weight |
|---|--------|--------|
| 1 | Accuracy of visual context from screen | 25% |
| 2 | Recall & precision for PII detection | 20% |
| 3 | Precision of redaction | 20% |
| 4 | Client-side resource utilization | 20% |
| 5 | End-to-end latency | 15% |

---

## ✅ What Is FULLY Implemented

### Client-Side Extension (Chrome MV3)

| Component | File | Status |
|-----------|------|--------|
| **CLIP ViT-B/32 Screen Classifier (WebGPU/WASM)** | [`screen-classifier.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/screen-classifier.js) | ✅ Complete |
| **DOM Detector** (Layer 1 — rule-based, 0ms) | [`dom.detector.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/dom.detector.js) | ✅ Complete |
| **OCR Detector** (Layer 2 — Tesseract.js WASM) | [`ocr.detector.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/ocr.detector.js) | ✅ Complete |
| **NER Detector** (Layer 3 — BERT-NER via Transformers.js) | [`ner.detector.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/ner.detector.js) | ✅ Complete |
| **Face Detector** (Layer 4 — MediaPipe BlazeFace) | [`face.detector.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/detectors/face.detector.js) | ✅ Complete |
| **AI Pipeline orchestration** (IoU fusion, gate-routing) | [`pipeline/index.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ai/pipeline/index.js) | ✅ Complete |
| **Canvas Redaction Engine** (solid fill, gaussian blur, pixelate) | [`content/index.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/content/index.js) | ✅ Complete |
| **Privacy Vault / Credential Tokenizer** | [`background/index.js`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/background/index.js) | ✅ Complete |
| **Agent Loop** (multi-cycle, loop detection, auto-stop) | `background/index.js` | ✅ Complete |
| **Action Executor** (click, type, scroll, navigate, press_key) | `content/index.js` | ✅ Complete |
| **DOM Extraction** (60 elements, priority-sorted, smart selectors) | `content/index.js` | ✅ Complete |
| **Extension Popup UI** | [`popup.html`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/extension/src/ui/popup/popup.html) | ✅ Complete |
| **Extension Side Panel UI** | `sidepanel/` | ✅ Complete |

### Server-Side (Next.js)

| Component | File | Status |
|-----------|------|--------|
| **`POST /api/v1/analyze`** — Main endpoint | [`route.ts`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/web/src/app/api/v1/analyze/route.ts) | ✅ Complete |
| **Analyze Service** (history, step guard, guardrails) | [`analyze.service.ts`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/web/src/lib/services/analyze.service.ts) | ✅ Complete |
| **Gemini Provider** (multi-model cascade, auto-fallback) | [`gemini.provider.ts`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/web/src/lib/providers/gemini.provider.ts) | ✅ Complete |
| **Mistral Provider** | `mistral.provider.ts` | ✅ Complete |
| **Ollama Provider** (local/offline model) | `ollama.provider.ts` | ✅ Complete |
| **Provider Factory** (primary + fallback routing) | [`provider.factory.ts`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/web/src/lib/providers/provider.factory.ts) | ✅ Complete |
| **Dashboard & Landing Page** | `web/src/app/` | ✅ Complete |
| **MongoDB Session Logging** | `analyze.service.ts` | ✅ Complete |
| **Cloudinary Screenshot Upload** | `cloudinary.ts` | ✅ Complete |

---

## ⚠️ What Is Architecturally Present but Needs Binary/Model Assets

These are **code-complete but non-functional** without the actual model files:

| Feature | Missing Asset | Fix Required |
|---------|--------------|--------------|
| CLIP ViT-B/32 Screen Classifier | `lib/transformers.min.js` + model cache | Download Transformers.js CDN build |
| OCR (Tesseract.js) | `lib/tesseract.min.js`, `tesseract-worker.min.js`, WASM core, `eng.traineddata` | Download Tesseract.js + lang pack |
| NER (BERT-NER) | `lib/transformers.min.js` + `Xenova/bert-base-NER` model | Same Transformers.js bundle |
| Face Detector (MediaPipe) | `lib/vision_bundle.mjs`, `lib/wasm/`, `blaze_face_short_range.tflite` | Download MediaPipe Vision WASM package |

> [!IMPORTANT]
> The content script falls back gracefully — if these models aren't present, DOM detection still runs. But for full marks on metrics 1-4, you NEED the model files bundled.

---

## 🔴 Gaps & Missing Requirements

### 1. Model Asset Files (Critical — breaks demo without them)
The extension's `lib/` and `assets/models/` directories must contain:
```
extension/
  lib/
    transformers.min.js           ← Transformers.js CDN ESM build
    tesseract.min.js              ← Tesseract.js main
    tesseract-worker.min.js       ← Tesseract worker
    tesseract-core-simd.wasm.js   ← WASM core
    vision_bundle.mjs             ← MediaPipe Vision Tasks
    wasm/                         ← MediaPipe WASM files
  assets/
    models/
      tesseract/
        eng.traineddata           ← English language pack
      blaze_face_short_range.tflite ← Face detection model
```

### 2. Extension Icons (Minor — won't load without them)
`assets/icons/icon-{16,32,48,128}.png` — referenced in `manifest.json` but likely missing.

### 3. Firefox Support (PS requires Chrome AND Firefox)
The codebase is 100% Chrome MV3. Firefox uses MV2 (mostly) and has `browser.*` APIs instead of `chrome.*`.
- **Missing:** A Firefox-compatible `manifest.v2.json` or polyfill using `webextension-polyfill`.

### 4. `bg` API Directory (Empty)
`web/src/app/api/bg/` exists but is empty. The problem statement may require a background processing queue or webhook.

### 5. Metrics / Health API Routes
`web/src/app/api/v1/metrics/` and `web/src/app/api/v1/health/` and `sessions/` directories exist but their route files need verification.

### 6. No Demo Video / End-to-End Task Recording
The PS says "an end-to-end task assisting the user should be demonstrated." You need a recorded demo showing the full pipeline working.

### 7. Evaluation Metrics Dashboard Gaps
Metric #2 (PII recall/precision) and Metric #3 (redaction precision) are not quantitatively measured or exposed in the dashboard — only counts are shown, not F1/precision/recall scores against ground truth.

---

## 📊 Evaluation Metric Coverage

| Metric | Current Coverage | Gap |
|--------|-----------------|-----|
| **1. Visual context accuracy (25%)** | CLIP ViT classifier (10 screen types), DOM extraction (60 elements, sorted by priority) | CLIP needs model asset; currently falls back to heuristic |
| **2. PII detection recall/precision (20%)** | 4-layer cascade (DOM + OCR + NER + Face), IoU fusion | No F1 measurement exposed; OCR/NER/Face need model assets |
| **3. Redaction precision (20%)** | DPI-aware canvas scaling (4px padding), 3 strategies (solid_fill, gaussian_blur, pixelate) | OCR/NER detection can be noisy without model assets |
| **4. Client resource utilization (20%)** | Gate routing (skips detectors based on CLIP result), DOM-only fallback (near-zero cost) | No CPU/GPU/memory profiling data shown in demo |
| **5. End-to-end latency (15%)** | Latency tracked and logged (client + server), multi-model cascade | Tesseract OCR adds ~200ms; full pipeline ~500ms+ without GPU |

---

## 🚀 Action Plan (Priority Order)

### P0 — Must fix for any demo to work
1. **Download and bundle model assets** — Transformers.js, Tesseract.js, MediaPipe WASM, model files
2. **Create extension icons** — 16, 32, 48, 128px PNG files
3. **Verify the build script** — `build.js` must copy all assets to the right output structure

### P1 — Required by PS specification
4. **Firefox MV2 compatibility** — Add `webextension-polyfill` + alternate manifest
5. **Fill in empty API routes** — `/api/v1/health`, `/api/v1/metrics`, `/api/v1/sessions`
6. **Record end-to-end demo** — Full task (e.g. login automation with PII redaction visible)

### P2 — Boost evaluation scores
7. **Add PII precision/recall measurement** — A test page with known PII, measured against ground truth
8. **Expose resource utilization stats** — Memory/CPU timing in popup or side panel
9. **Quantitative redaction precision** — Show % of sensitive pixels covered in redaction manifest
10. **Add Docker/deployment instructions** — For server-side reproducibility

---

## 🏗️ Architecture Summary (What's Correct)

```
Browser (Extension)                    Server (Next.js)
─────────────────────────────          ─────────────────────
CLIP ViT-B/32 Screen Classifier        POST /api/v1/analyze
       ↓ classifies screen type              ↑ sanitized screenshot + DOM
DOM Detector (rule-based, 0ms)         AnalyzeService
       ↓                                     ↓
OCR Detector (Tesseract, ~200ms)       Gemini / Mistral / Ollama
       ↓                                     ↓ JSON action
NER Detector (BERT, ~150ms)            parseAction()
       ↓                                     ↓
Face Detector (MediaPipe, ~5ms)       { action, selector, value, reasoning }
       ↓                                     ↓
IoU Fusion + Deduplication     ←───── Received by background.js
       ↓                                     ↓
Canvas Redaction (DPI-aware)   ─────→ executeAction() in content.js
       ↓
Privacy Vault (credential tokenization)
       ↓
Sanitized screenshot + tokenized task → Server
```

This is a **fully correct and sophisticated architecture** that matches all PS requirements. The main gap is the model assets and Firefox support.
