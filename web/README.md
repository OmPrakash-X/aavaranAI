# 🌐 Aavaran — Web Application & Analytics Dashboard

The Next.js 16+ App Router web service powering the Aavaran platform.

- **VLM Inference API**: Handles `POST /api/v1/analyze`, receiving sanitized visual context and prioritized DOM data.
- **Provider Cascade**: Multi-model routing across Google Gemini 1.5 Flash, Mistral Pixtral 12B, and local offline Ollama LLaVA.
- **Security Dashboard**: Real-time observability interface at `/dashboard` displaying E2E latency, PII detection distributions, and session replay audit trails.
- **Design System**: Liquid Glass Monochrome UI system ([`DESIGN.md`](../docs/DESIGN.md)).

---

## 📖 Documentation

For the full production guide, API specifications, and architectural documentation, please refer to:

- 🌐 **[Web Server Production Guide (docs/WEB.md)](../docs/WEB.md)**
- 🛡️ **[Master Project Documentation (README.md)](../README.md)**
- 🧩 **[Extension Production Guide (docs/EXTENSION.md)](../docs/EXTENSION.md)**

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (copy template)
cp .env.example .env.local

# 3. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the landing page and [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the analytics console.
