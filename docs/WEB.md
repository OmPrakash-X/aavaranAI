# 🌐 Aavaran Web Server & Dashboard — Production Documentation

> **Next.js 16+ App Router Backend, Multi-VLM Provider Cascade, & Security Dashboard**  
> *Redaction-Aware Vision Processing | Gemini, Mistral & Offline Ollama Fallback | Cloudinary & MongoDB Persistence*

---

## 📑 Table of Contents
1. [Architectural Overview](#1-architectural-overview)
2. [Directory Structure](#2-directory-structure)
3. [Environment Configuration & Variables](#3-environment-configuration--variables)
4. [API Specifications & Contracts](#4-api-specifications--contracts)
   - [`POST /api/v1/analyze`](#post-apiv1analyze)
   - [`GET /api/v1/health`](#get-apiv1health)
   - [`GET /api/v1/metrics`](#get-apiv1metrics)
   - [`GET /api/v1/sessions`](#get-apiv1sessions)
   - [`GET /api/bg`](#get-apibg)
5. [The Multi-VLM Provider Architecture](#5-the-multi-vlm-provider-architecture)
   - [Gemini Provider (Primary)](#gemini-provider-primary)
   - [Mistral Pixtral Provider (Fallback)](#mistral-pixtral-provider-fallback)
   - [Ollama Provider (100% Offline / Local)](#ollama-provider-100-offline--local)
   - [Automatic Fallback Cascade (`provider.factory.ts`)](#automatic-fallback-cascade)
6. [Analyze Service & Safety Guardrails](#6-analyze-service--safety-guardrails)
   - [Prompt Engineering & Redaction-Aware Context](#prompt-engineering--redaction-aware-context)
   - [Anti-Runaway Step Limiter (10-Step Hard Cap)](#anti-runaway-step-limiter)
   - [Pre-VLM Login Completion Guard](#pre-vlm-login-completion-guard)
   - [Server-Side Credential Sanitization](#server-side-credential-sanitization)
7. [Database Schema & Session Logging (MongoDB)](#7-database-schema--session-logging-mongodb)
8. [Media & Screenshot Pipeline (Cloudinary)](#8-media--screenshot-pipeline-cloudinary)
9. [Web Dashboard & Visualization Architecture](#9-web-dashboard--visualization-architecture)
10. [Deployment & Production Runbook](#10-deployment--production-runbook)
11. [Troubleshooting & Verification](#11-troubleshooting--verification)

---

## 1. Architectural Overview

The **Aavaran Web Server** provides the intelligent orchestration, Vision-Language Model (VLM) reasoning, persistent telemetry, and observability dashboard for the privacy-preserving agent platform.

```
       ┌────────────────────────────────────────────────────────┐
       │             Browser Extension (Client)                 │
       │    Sanitized Screenshot + DOM JSON + Redaction Manifest │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTPS POST /api/v1/analyze
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             Next.js 16+ App Router Server             │
       │                                                        │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │               Analyze Service                     │  │
       │  │  - In-memory action history & loop detection     │  │
       │  │  - Redaction-aware system prompt synthesis       │  │
       │  │  - Server-side credential sanitization           │  │
       │  └──────────────────────────┬───────────────────────┘  │
       │                             │                          │
       │                             ▼                          │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │           Provider Fallback Cascade              │  │
       │  │                                                  │  │
       │  │   [Primary: Gemini 1.5 Flash]                    │  │
       │  │          │ (failover)                            │  │
       │  │          ▼                                       │  │
       │  │   [Fallback 1: Mistral Pixtral 12B]              │  │
       │  │          │ (failover)                            │  │
       │  │          ▼                                       │  │
       │  │   [Fallback 2: Ollama Local (LLaVA)]             │  │
       │  └──────────────────────────┬───────────────────────┘  │
       │                             │                          │
       │                             ▼ Structured Action JSON   │
       └─────────────────────────────┼──────────────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
       ┌───────────────────────────┐   ┌───────────────────────────┐
       │      MongoDB Atlas        │   │    Cloudinary CDN         │
       │  Telemetry, Sessions,     │   │  Redacted Thumbnail Image │
       │  Latency & PII Manifests  │   │  Storage for Audit Logs   │
       └───────────────────────────┘   └───────────────────────────┘
```

### Core Responsibilities
1. **Redaction-Aware Reasoning**: Communicates with VLMs that receive **already-redacted screenshots** and explicitly instructs them to interact with anonymous tokens rather than demanding unmasked secrets.
2. **Dual-Input Context**: Fuses visual pixel structure with a prioritized 60-element interactive DOM JSON payload to ensure precision targeting without coordinate hallucinations.
3. **Resilience & Fallback**: Seamlessly cascades from cloud vision models (Gemini Flash, Mistral Pixtral) to local, free, GPU-driven offline models (Ollama LLaVA).
4. **Auditability & Observability**: Stores end-to-end telemetry (client perception time, model inference time, network round-trip, PII detection breakdown) in MongoDB and renders real-time insights on the Next.js Dashboard.

---

## 2. Directory Structure

```
web/
├── public/                      # Static assets, fonts, icons, background images
├── src/
│   ├── app/
│   │   ├── (dashboard)/         # Authenticated / Observability Layout
│   │   │   ├── dashboard/
│   │   │   │   ├── detections/  # PII detection frequency & layer breakdown
│   │   │   │   ├── live/        # Live streaming session monitor
│   │   │   │   ├── sessions/    # Full session replay & screenshot gallery
│   │   │   │   ├── settings/    # Model selection & provider test console
│   │   │   │   └── page.tsx     # Main analytics overview
│   │   │   └── layout.tsx       # Sidebar, navigation, glassmorphic container
│   │   ├── api/
│   │   │   ├── bg/              # Procedural / cached liquid glass background
│   │   │   └── v1/
│   │   │       ├── analyze/     # Core inference endpoint (POST)
│   │   │       ├── health/      # Uptime & connection monitor (GET)
│   │   │       ├── metrics/     # Aggregated analytics endpoint (GET)
│   │   │       └── sessions/    # Session history & thumbnail fetch (GET)
│   │   ├── globals.css          # Tailwind CSS v4 design tokens & theme
│   │   ├── layout.tsx           # Root HTML shell & fonts
│   │   └── page.tsx             # Interactive marketing & product landing page
│   └── lib/
│       ├── cloudinary.ts        # Cloudinary upload service with base64 fallback
│       ├── constants/
│       │   └── prompts.ts       # System prompts, VLM instructions, few-shot rules
│       ├── db/
│       │   ├── connection.ts    # Cached Mongoose connection handler
│       │   └── models/
│       │       └── session.model.ts # Mongoose schema for session telemetry
│       ├── providers/
│       │   ├── base.provider.ts     # Abstract VLM provider interface
│       │   ├── gemini.provider.ts   # Google Gemini 1.5 Flash adapter
│       │   ├── mistral.provider.ts  # Mistral Pixtral adapter
│       │   ├── ollama.provider.ts   # Local Ollama LLaVA/MiniCPM adapter
│       │   ├── provider.factory.ts  # Dynamic fallback resolver
│       │   └── index.ts             # Barrel exports
│       ├── services/
│       │   └── analyze.service.ts   # Business logic, guardrails, session tracking
│       ├── types/
│       │   └── api.types.ts         # TypeScript interfaces & API contracts
│       └── utils/
│           └── action-parser.ts     # Robust JSON extraction & repair from VLM
├── .env.local                   # Environment secrets and API configurations
├── next.config.ts               # Next.js build and image optimization settings
├── package.json                 # Dependencies (Next 16, React 19, Mongoose 9)
├── tsconfig.json                # TypeScript compiler configuration
└── tailwind.config.ts           # Styling configuration
```

---

## 3. Environment Configuration & Variables

Configured in `web/.env.local`:

```ini
# ============================================================
# MongoDB Persistence
# ============================================================
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/aavaran?retryWrites=true&w=majority

# ============================================================
# Google Gemini (Primary Vision VLM)
# ============================================================
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-flash-lite-latest

# ============================================================
# Mistral AI (Fallback Cloud Vision VLM)
# ============================================================
MISTRAL_API_KEY=...
MISTRAL_MODEL=pixtral-12b-2409

# ============================================================
# VLM Provider Selection & Routing
# Options: gemini | mistral | ollama
# ============================================================
VLM_PRIMARY_PROVIDER=gemini
VLM_FALLBACK_PROVIDER=mistral

# ============================================================
# Ollama (Local Edge Vision Model — Free, Zero API Key)
# ============================================================
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llava

# ============================================================
# Cloudinary CDN (Redacted Screenshot Storage)
# ============================================================
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# ============================================================
# Application URL
# ============================================================
NEXT_PUBLIC_APP_NAME=Aavaran
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. API Specifications & Contracts

### `POST /api/v1/analyze`
The primary endpoint called by the browser extension on every agent decision cycle.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Payload (`AnalyzeRequest`)
```json
{
  "sessionId": "sess_1727581234_abc89",
  "userTask": "Log into GitHub with username Puspa and my password",
  "pageTitle": "Sign in to GitHub · GitHub",
  "clientLatency": 142,
  "screenClassification": {
    "screenType": "login_form",
    "description": "Login / Sign-in page",
    "confidence": 0.94,
    "device": "webgpu",
    "latency": 88
  },
  "screenshot": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "thumbnail": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "redactionManifest": [
    {
      "type": "password",
      "bbox": { "x": 450, "y": 320, "width": 280, "height": 38 },
      "strategy": "solid_fill",
      "confidence": 0.95,
      "detectedBy": "dom"
    }
  ],
  "domElements": [
    {
      "id": "login_field",
      "tag": "input",
      "type": "text",
      "text": "Username or email address",
      "placeholder": "",
      "ariaLabel": "Username or email address",
      "role": null,
      "name": "login",
      "value": "",
      "href": null,
      "autocomplete": "username",
      "isDisabled": false,
      "isChecked": null,
      "selector": "#login_field",
      "bbox": { "x": 450, "y": 240, "width": 280, "height": 38 }
    }
  ]
}
```

#### Response Payload (`AnalyzeResponse`)
```json
{
  "action": {
    "action": "type",
    "selector": "#login_field",
    "value": "Puspa",
    "reasoning": "The user requested logging in. The username input field (#login_field) is empty.",
    "nextExpectation": "Username will be filled, next step will target the password field",
    "confidence": 0.96
  },
  "sessionId": "sess_1727581234_abc89",
  "latency": 842,
  "provider": "gemini"
}
```

---

### `GET /api/v1/health`
Checks backend readiness, MongoDB connectivity, and configured VLM providers.

#### Response Example
```json
{
  "status": "ok",
  "providers": {
    "gemini": true,
    "mistral": true
  },
  "database": true,
  "uptime": 14285,
  "timestamp": "2026-09-29T10:43:00.000Z"
}
```

---

### `GET /api/v1/metrics`
Aggregates performance across all stored sessions for dashboard metrics.

#### Response Example
```json
{
  "totalSessions": 128,
  "totalDetections": 492,
  "avgLatency": 920,
  "avgDetectionsPerSession": 3.8,
  "piiBreakdown": {
    "password": 154,
    "email": 132,
    "phone": 84,
    "aadhaar": 38,
    "face": 46,
    "credit_card": 38
  },
  "providerUsage": {
    "gemini": 112,
    "mistral": 14,
    "ollama": 2
  },
  "recentSessions": [...]
}
```

---

### `GET /api/v1/sessions`
Returns paginated recent sessions with optional base64 / Cloudinary thumbnail payloads for session replay.

---

### `GET /api/bg`
Serves cached high-resolution glassmorphism background art, falling back to a procedural vector SVG gradient if the binary asset is not cached locally.

---

## 5. The Multi-VLM Provider Architecture

Aavaran implements an extensible provider interface (`BaseVLMProvider`) enabling pluggable model integration.

```typescript
export interface BaseVLMProvider {
  name: string;
  analyze(
    screenshotBase64: string,
    prompt: string,
    systemPrompt: string
  ): Promise<string>;
}
```

### 1. Gemini Provider (`gemini.provider.ts`)
- **SDK**: `@google/generative-ai`
- **Default Model**: `gemini-1.5-flash` or `gemini-flash-lite-latest`
- **Inference Speed**: ~600ms - 900ms
- **Output Mode**: Constrained JSON schema output (`responseMimeType: "application/json"`)
- **Advantage**: Lowest cloud latency with strong reasoning over combined visual and DOM inputs.

### 2. Mistral Provider (`mistral.provider.ts`)
- **SDK**: `@mistralai/mistralai`
- **Default Model**: `pixtral-12b-2409`
- **Inference Speed**: ~1.1s - 1.6s
- **Advantage**: Open-weight architecture with strong spatial coordinate precision.

### 3. Ollama Provider (`ollama.provider.ts`)
- **Endpoint**: Configured locally via `http://localhost:11434/api/generate`
- **Default Model**: `llava` or `minicpm-v`
- **API Cost**: **$0.00 (100% Free & Local)**
- **Advantage**: Demonstrates **complete end-to-end sovereignty**. Even if external internet is completely severed, Aavaran continues operating locally.

### Automatic Fallback Cascade
In [`provider.factory.ts`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/web/src/lib/providers/provider.factory.ts), the `analyzeWithFallback` runner executes:
1. Attempts `VLM_PRIMARY_PROVIDER` (e.g. Gemini).
2. If rate-limited, expired, or network fails, catches the error and executes `VLM_FALLBACK_PROVIDER` (e.g. Mistral).
3. If cloud is unreachable, falls back to `ollama`.

---

## 6. Analyze Service & Safety Guardrails

Located in [`analyze.service.ts`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/web/src/lib/services/analyze.service.ts):

### Redaction-Aware Prompt Engineering
The system prompt explicitly informs the VLM that visual privacy filters are in effect:
> *"NOTICE: The screenshot has been sanitized on the client side. Blacked-out boxes represent passwords or government IDs. Blurred regions represent human faces. You must not attempt to guess or hallucinate these values. To type a password, use the token `<LOCAL_SECRET_PASSWORD>`."*

### Anti-Runaway Step Limiter
To prevent infinite agent billing loops or destructive continuous clicks:
- Each session tracks its step counter.
- If `stepCount >= 10`, the server forces an immediate termination action:
  ```json
  { "action": "done", "reasoning": "Step limit (10) reached for this session." }
  ```

### Pre-VLM Login Completion Guard
Detects when a login flow has completed:
- If history confirms the agent typed a username, typed a password, and clicked a `submit`/`sign-in` button, it halts the loop locally **before invoking the VLM**, saving latency and API cost.

### Server-Side Credential Sanitization
Even though real passwords never reach the server, users sometimes pass usernames or OTP tokens in the task prompt.
- `sanitizeReasoning()` regex-filters the VLM's generated reasoning string before it is stored in MongoDB:
  ```javascript
  sanitized = sanitized.replace(new RegExp(`\\b${credValue}\\b`, 'g'), '[REDACTED]');
  ```

---

## 7. Database Schema & Session Logging (MongoDB)

Defined in [`session.model.ts`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/web/src/lib/db/models/session.model.ts):

```typescript
const SessionSchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  stepIndex: { type: Number, default: 0 },
  pageTitle: { type: String, required: true },
  pageDomain: { type: String, required: true },
  userTask: { type: String, required: true },
  totalDetections: { type: Number, default: 0 },
  detections: [{
    type: { type: String },
    bbox: { x: Number, y: Number, width: Number, height: Number },
    confidence: Number,
    detectedBy: String
  }],
  redactionManifest: [{
    type: { type: String },
    strategy: String,
    confidence: Number
  }],
  action: {
    action: String,
    selector: String,
    value: String,
    reasoning: String,
    nextExpectation: String
  },
  latency: {
    clientPerception: Number,
    serverInference: Number,
    totalEndToEnd: Number
  },
  vlmProvider: { type: String, required: true },
  screenshotUrl: { type: String }, // Cloudinary CDN URL
  success: { type: Boolean, default: true }
}, { timestamps: true });
```

---

## 8. Media & Screenshot Pipeline (Cloudinary)

- **Implementation**: [`cloudinary.ts`](file:///c:/Users/omnay/Desktop/Hackathons/aavaran/web/src/lib/cloudinary.ts)
- **Thumbnails**: The client uploads a compressed 640px JPEG (~25KB).
- **Security Check**: Only **sanitized (redacted)** images are sent to Cloudinary. Raw user screens are never saved.
- **Resilience**: If Cloudinary credentials are unset or the service is unreachable, the system stores the base64 thumbnail directly inside MongoDB without blocking the user flow.

---

## 9. Web Dashboard & Visualization Architecture

Access the real-time observability dashboard at `http://localhost:3000/dashboard`:

- **Overview (`/dashboard`)**:
  - Live E2E latency counters & session activity streams.
  - Interactive SVG radial metrics for visual perception accuracy.
- **Detections View (`/dashboard/detections`)**:
  - Breakdown of detected PII by category (Aadhaar, PAN, Passwords, Faces).
  - Accuracy distribution comparing DOM heuristics vs OCR/NER machine learning.
- **Live Feed (`/dashboard/live`)**:
  - WebSocket / polling stream displaying active browser sessions as they execute.
- **Session Replay (`/dashboard/sessions`)**:
  - Audit trail displaying side-by-side redacted screenshots with the exact action and reasoning taken by the agent.
- **Settings Console (`/dashboard/settings`)**:
  - Dynamic toggling between Gemini, Mistral, and local Ollama without restarting the server.

---

## 10. Deployment & Production Runbook

### Prerequisites
- Node.js `v20.x` or `v22.x`
- MongoDB database instance (Atlas or local `mongod`)
- Optional: Local Ollama runtime (`ollama serve`)

### Installation & Build
```powershell
cd web
npm install
npm run build
```

### Running Locally in Development
```powershell
npm run dev
# Server listening on http://localhost:3000
```

### Production Deployment (Node / Docker)
```powershell
npm run start
```

---

## 11. Troubleshooting & Verification

| Symptom | Cause | Solution |
|---|---|---|
| `500 Internal Server Error` on `/api/v1/analyze` | VLM API key invalid or rate-limited | Check `.env.local` for `GEMINI_API_KEY`. Verify `VLM_FALLBACK_PROVIDER=mistral` or set to `ollama`. |
| Dashboard shows 0 sessions | MongoDB not connected | Verify `MONGODB_URI` string. Run `GET http://localhost:3000/api/v1/health` to inspect the DB connection status. |
| Ollama provider fails with `ECONNREFUSED` | Local Ollama daemon not running | Run `ollama serve` and verify `ollama run llava` is downloaded. |
| CORS errors when extension calls API | Next.js API origin headers | The API routes explicitly set `'Access-Control-Allow-Origin': '*'`. Ensure custom proxy rules do not strip this header. |
