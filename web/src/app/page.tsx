"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  Check,
  EyeOff,
  Cpu,
  RefreshCw,
  Zap,
  Shield,
  Sparkles,
  Layers,
  Lock,
  ChevronRight,
  Activity
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"detection" | "sanitization" | "execution">("detection");

  return (
    <div className="min-h-screen bg-transparent text-[#111111] selection:bg-[#111111] selection:text-white">
      {/* ─── TOP NAVIGATION ─────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/70 transition-all">
        <div className="max-w-[1140px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[17px] tracking-tight text-[#111111]">Aavaran</span>
            <span className="text-[11px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full liquid-glass-pill text-[#555555]">
              v1.0 Vision
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#666666]">
            <a href="#features" className="hover:text-[#111111] transition-colors">Features</a>
            <a href="#architecture" className="hover:text-[#111111] transition-colors">Architecture</a>
            <a href="#security" className="hover:text-[#111111] transition-colors">Privacy Shield</a>
            <a href="#metrics" className="hover:text-[#111111] transition-colors">Performance</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill-dark text-white text-[13px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-xs"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ───────────────────────────────────── */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-24 px-6 overflow-hidden">
        <div className="max-w-[1140px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-[12px] font-medium text-[#444444] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#111111]" />
                Liquid Glass Monochrome UI
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-[#111111] leading-[1.08]">
                Visual intelligence with zero privacy compromise.
              </h1>

              <p className="text-[16px] md:text-[18px] text-[#666666] leading-relaxed max-w-xl font-normal">
                Aavaran detects, masks, and redacts sensitive PII directly inside the browser using client-side AI before routing visual perception context to high-speed cloud VLM orchestrators.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-full liquid-glass-pill-dark text-white text-[14px] font-semibold tracking-wide transition-all hover:bg-[#262626] shadow-sm hover:translate-y-[-1px]"
                >
                  Launch Dashboard
                </Link>
                <a
                  href="#architecture"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-full liquid-glass-pill border border-[#111111] text-[#111111] text-[14px] font-semibold tracking-wide transition-all hover:bg-white"
                >
                  Explore Pipeline
                </a>
              </div>

              {/* Trust Signal */}
              <div className="pt-6 flex items-center gap-6 text-[12px] text-[#666666]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111]" />
                  <span>100% Client-Side Masking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111]" />
                  <span>GDPR / HIPAA Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#111111]" />
                  <span>Sub-50ms Latency</span>
                </div>
              </div>
            </div>

            {/* Right: Floating Glass Perception Preview */}
            <div className="lg:col-span-5 relative">
              {/* Background ambient depth glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-black/[0.04] to-black/[0.01] rounded-3xl -z-10 blur-xl" />

              {/* Liquid Glass Hero Card */}
              <div className="glass p-6 border border-white/80 shadow-glass rounded-[28px] relative transition-transform duration-300 hover:rotate-0 rotate-[1.5deg]">
                {/* Simulated Glass Browser Frame */}
                <div className="glass-card rounded-[20px] p-4 border border-white/80 shadow-md">
                  {/* Browser Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0] mb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E0E0E0]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E0E0E0]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E0E0E0]" />
                    </div>
                    <div className="text-[11px] font-mono text-[#888888] bg-[#F7F7F7] px-3 py-1 rounded-full border border-[#EBEBEB]">
                      https://app.secureportal.in/auth
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#111111]" />
                  </div>

                  {/* Visual Perception Canvas Preview */}
                  <div className="relative aspect-video rounded-xl bg-[#F7F7F7] border border-[#EBEBEB] p-4 flex flex-col justify-between overflow-hidden">
                    {/* Simulated form with redacted areas */}
                    <div className="space-y-2.5">
                      <div className="h-3 w-28 bg-[#E0E0E0] rounded-sm" />
                      <div className="relative p-2 rounded-lg bg-white border border-[#EBEBEB] flex items-center justify-between">
                        <span className="text-[11px] text-[#888888]">Aadhaar Identification</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#111111] text-white font-mono text-[10px] tracking-wider">
                          [REDACTED_AADHAAR]
                        </span>
                      </div>
                      <div className="relative p-2 rounded-lg bg-white border border-[#EBEBEB] flex items-center justify-between">
                        <span className="text-[11px] text-[#888888]">Payment Card No.</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#111111] text-white font-mono text-[10px] tracking-wider">
                          •••• •••• •••• 4092
                        </span>
                      </div>
                    </div>

                    {/* Masking telemetry badge */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#EBEBEB]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#111111]" />
                        <span className="text-[11px] font-medium text-[#111111]">Privacy Redaction: Active</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#888888]">3 entities secured</span>
                    </div>
                  </div>

                  {/* Lower status pill indicator */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#777777]">
                    <span>Target: Gemini 2.5 Flash</span>
                    <span className="font-mono text-[#111111]">Action: click(#submit)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STAT BAR (DARK MONOCHROME CONTAINER) ───────────── */}
      <section id="metrics" className="py-8 px-6">
        <div className="max-w-[1140px] mx-auto">
          <div className="card-dark rounded-[24px] p-8 md:p-10 border border-white/10 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="md:pr-8 space-y-2">
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-4xl lg:text-5xl font-bold text-white tracking-tight">&lt;45ms</span>
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">Local</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white">Client-side PII Redaction</h3>
                <p className="text-[13px] text-white/60">
                  Instant real-time neural and rule-based masking executed in-browser before serialization.
                </p>
              </div>

              <div className="pt-8 md:pt-0 md:px-8 space-y-2">
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-4xl lg:text-5xl font-bold text-white tracking-tight">100%</span>
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">Sanitized</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white">Zero Raw Data In Transit</h3>
                <p className="text-[13px] text-white/60">
                  Passwords, biometric faces, PAN, and payment details are never exposed to remote model APIs.
                </p>
              </div>

              <div className="pt-8 md:pt-0 md:pl-8 space-y-2">
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                  <span className="text-4xl lg:text-5xl font-bold text-white tracking-tight">9+</span>
                  <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">Cascades</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white">Multi-Model Resilience</h3>
                <p className="text-[13px] text-white/60">
                  Instant fallback cascade across Gemini Flash, Pro, 2.0 Thinking, and Mistral endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3-COLUMN FEATURES SECTION ─────────────────────── */}
      <section id="features" className="py-20 md:py-24 px-6">
        <div className="max-w-[1140px] mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#111111]">
              Engineered for absolute privacy and relentless autonomy.
            </h2>
            <p className="text-[15px] text-[#777777]">
              Every layer of the Aavaran architecture separates user perception from cloud intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="liquid-glass-card p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-white flex items-center justify-center text-[#111111] mb-6 shadow-xs">
                <EyeOff className="w-6 h-6 text-[#111111]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#111111] mb-2">
                On-device multimodal redaction
              </h3>
              <p className="text-[14px] text-[#666666] leading-relaxed">
                Combines regex patterns, canvas pixel manipulation, and browser-native lightweight models to obscure sensitive fields like Aadhaar, PAN, emails, and faces prior to frame transmission.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="liquid-glass-card p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-white flex items-center justify-center text-[#111111] mb-6 shadow-xs">
                <Cpu className="w-6 h-6 text-[#111111]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#111111] mb-2">
                Structured visual reasoning
              </h3>
              <p className="text-[14px] text-[#666666] leading-relaxed">
                State-of-the-art vision models evaluate the redacted visual canvas alongside parsed DOM hierarchies to produce exact, deterministic action steps with explicit coordinates and selectors.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="liquid-glass-card p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-white flex items-center justify-center text-[#111111] mb-6 shadow-xs">
                <RefreshCw className="w-6 h-6 text-[#111111]" />
              </div>
              <h3 className="text-[18px] font-semibold text-[#111111] mb-2">
                Closed-loop action verification
              </h3>
              <p className="text-[14px] text-[#666666] leading-relaxed">
                The content script executes clicks, keyboard inputs, or navigation, capturing the subsequent state to verify task completion and correct for dynamic web alterations in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ARCHITECTURE / PIPELINE SECTION ────────────────── */}
      <section id="architecture" className="py-20 bg-white border-y border-[#EBEBEB] px-6">
        <div className="max-w-[1140px] mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-[#888888]">Architecture</span>
              <h2 className="text-3xl font-bold tracking-tight text-[#111111] mt-1">
                The sanitized intelligence pipeline.
              </h2>
            </div>

            {/* Interactive pipeline switcher */}
            <div className="pill-group inline-flex bg-[#F0F0F0] p-1 rounded-full border border-[#EBEBEB]">
              <button
                onClick={() => setActiveTab("detection")}
                className={`pill-option text-[12px] font-medium px-4 py-1.5 rounded-full transition-all ${
                  activeTab === "detection" ? "bg-[#111111] text-white" : "text-[#777777] hover:text-[#111111]"
                }`}
              >
                1. Local Detection
              </button>
              <button
                onClick={() => setActiveTab("sanitization")}
                className={`pill-option text-[12px] font-medium px-4 py-1.5 rounded-full transition-all ${
                  activeTab === "sanitization" ? "bg-[#111111] text-white" : "text-[#777777] hover:text-[#111111]"
                }`}
              >
                2. Canvas Masking
              </button>
              <button
                onClick={() => setActiveTab("execution")}
                className={`pill-option text-[12px] font-medium px-4 py-1.5 rounded-full transition-all ${
                  activeTab === "execution" ? "bg-[#111111] text-white" : "text-[#777777] hover:text-[#111111]"
                }`}
              >
                3. VLM Reasoning
              </button>
            </div>
          </div>

          {/* Pipeline Explanation Card */}
          <div className="card rounded-[24px] p-8 md:p-10 border border-white/70">
            {activeTab === "detection" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-[12px] font-mono text-[#888888]">STAGE 01 / CLIENT INFERENCE</span>
                  <h3 className="text-2xl font-bold text-[#111111]">Real-time in-browser PII detection</h3>
                  <p className="text-[14px] text-[#666666] leading-relaxed">
                    When the extension triggers, DOM text nodes and raw viewport pixels are analyzed concurrently. Custom regex scanners intercept sensitive credentials, Aadhaar IDs, and payment details, while lightweight on-device models localize facial coordinates.
                  </p>
                  <ul className="space-y-2 text-[13px] text-[#555555]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                      Zero network calls during scanning phase
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                      Full bounding-box coordinate registration
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#EBEBEB] font-mono text-[12px] space-y-2 shadow-xs">
                  <div className="text-[#888888]">// Detection output sample</div>
                  <div className="text-[#111111]">&#123;</div>
                  <div className="pl-4 text-[#555555]">
                    &quot;entity&quot;: &quot;AADHAAR_NUMBER&quot;,<br />
                    &quot;bbox&quot;: &#123; &quot;x&quot;: 214, &quot;y&quot;: 382, &quot;w&quot;: 160, &quot;h&quot;: 28 &#125;,<br />
                    &quot;confidence&quot;: 0.99,<br />
                    &quot;strategy&quot;: &quot;blackout_fill&quot;
                  </div>
                  <div className="text-[#111111]">&#125;</div>
                </div>
              </div>
            )}

            {activeTab === "sanitization" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-[12px] font-mono text-[#888888]">STAGE 02 / PIXEL REDACTION</span>
                  <h3 className="text-2xl font-bold text-[#111111]">Canvas-level surgical blackout</h3>
                  <p className="text-[14px] text-[#666666] leading-relaxed">
                    Detected coordinates are masked directly on an off-screen HTML5 Canvas. Sensitive text is completely blacked out, and faces are blurred with cryptographic irreversibility before converting to compressed WebP/JPEG payload.
                  </p>
                  <ul className="space-y-2 text-[13px] text-[#555555]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                      Lossless redaction ensuring original text cannot be recovered
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                      Retains high-fidelity layout for visual grounding
                    </li>
                  </ul>
                </div>
                <div className="bg-[#0D0D0D] text-white p-6 rounded-2xl font-mono text-[12px] space-y-2">
                  <div className="text-[#888888]">// Canvas Transformation</div>
                  <div>ctx.fillStyle = &quot;#000000&quot;;</div>
                  <div>ctx.fillRect(item.x, item.y, item.w, item.h);</div>
                  <div className="text-[#888888] mt-2">// Result: Payload 100% Sanitized</div>
                </div>
              </div>
            )}

            {activeTab === "execution" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <span className="text-[12px] font-mono text-[#888888]">STAGE 03 / AGENTIC EXECUTION</span>
                  <h3 className="text-2xl font-bold text-[#111111]">Deterministic JSON browser actions</h3>
                  <p className="text-[14px] text-[#666666] leading-relaxed">
                    The backend multi-model cascade (Gemini 2.5 Flash / Mistral) processes the sanitized frame against the user&apos;s natural language instruction, responding with clean single-action JSON instructions that drive the browser.
                  </p>
                  <ul className="space-y-2 text-[13px] text-[#555555]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                      Structured schema validation on every turn
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                      Automatic failover to alternative provider upon quota or latency spikes
                    </li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-[#EBEBEB] font-mono text-[12px] space-y-2 shadow-xs">
                  <div className="text-[#888888]">// Executed Action Response</div>
                  <div className="text-[#111111]">&#123;</div>
                  <div className="pl-4 text-[#555555]">
                    &quot;action&quot;: &quot;click&quot;,<br />
                    &quot;selector&quot;: &quot;#continue-btn&quot;,<br />
                    &quot;reasoning&quot;: &quot;Form validation passed, advancing to verification step.&quot;
                  </div>
                  <div className="text-[#111111]">&#125;</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── CALL TO ACTION SECTION ─────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-[1140px] mx-auto">
          <div className="glass-dark rounded-[28px] p-10 md:p-16 text-center space-y-6 relative overflow-hidden border border-white/15 shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight max-w-2xl mx-auto">
              Ready to automate the web with absolute confidence?
            </h2>
            <p className="text-white/70 text-[15px] md:text-[17px] max-w-xl mx-auto font-normal">
              Experience the surgical precision of the Liquid Glass Monochrome management dashboard or launch the Chrome extension.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#111111] text-[14px] font-semibold tracking-wide transition-all hover:bg-[#F0F0F0] shadow-sm hover:scale-[1.02]"
              >
                Go to Live Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/60 bg-white/70 backdrop-blur-md py-12 px-6">
        <div className="max-w-[1140px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[13px] text-[#777777]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#111111] flex items-center justify-center text-white text-[11px] font-bold">
              A
            </div>
            <span className="font-semibold text-[#111111]">Aavaran</span>
            <span>— Privacy-Preserving Browser Vision Agent</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-[#111111] transition-colors">Dashboard</Link>
            <Link href="/dashboard/live" className="hover:text-[#111111] transition-colors">Live Stream</Link>
            <Link href="/dashboard/detections" className="hover:text-[#111111] transition-colors">PII Registry</Link>
            <Link href="/dashboard/settings" className="hover:text-[#111111] transition-colors">System Health</Link>
          </div>

          <div>
            <span>Liquid Glass Monochrome System v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
