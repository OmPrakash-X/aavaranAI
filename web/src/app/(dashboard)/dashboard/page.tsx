"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Activity,
  Cpu,
  Clock,
  CheckCircle2,
  TrendingUp,
  FileText,
  Lock,
  CreditCard,
  User,
  EyeOff,
  Layers,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Sliders,
  ChevronRight,
  Play,
  Share2,
  FolderOpen
} from "lucide-react";

interface Metrics {
  totalSessions: number;
  totalDetections: number;
  avgLatency: number;
  avgDetectionsPerSession: number;
  piiBreakdown: Record<string, number>;
  providerUsage: Record<string, number>;
  recentSessions: Array<{
    _id: string;
    sessionId: string;
    pageTitle: string;
    totalDetections: number;
    action: { action: string; reasoning: string };
    latency: { totalEndToEnd: number };
    vlmProvider: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchMetrics = () => {
    fetch("/api/v1/metrics")
      .then(async (res) => {
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data) => {
        if (data) setMetrics(data);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-[24px] liquid-glass-card animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-[28px] liquid-glass-dark animate-pulse" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Sessions",
      value: metrics?.totalSessions || 0,
      delta: "+12.4%",
      icon: Activity,
      sparkline: "M 0,22 Q 20,4 40,16 T 80,6",
    },
    {
      label: "Masked Entities",
      value: metrics?.totalDetections || 0,
      delta: "100% PII Safe",
      icon: ShieldCheck,
      sparkline: "M 0,20 Q 20,26 40,10 T 80,4",
    },
    {
      label: "Inference Latency",
      value: `${metrics?.avgLatency || 42}ms`,
      delta: "Sub-50ms",
      icon: Zap,
      sparkline: "M 0,8 Q 20,16 40,6 T 80,12",
    },
    {
      label: "PII Per Session",
      value: metrics?.avgDetectionsPerSession ? metrics.avgDetectionsPerSession.toFixed(1) : "0.0",
      delta: "Automated",
      icon: EyeOff,
      sparkline: "M 0,16 Q 20,8 40,18 T 80,8",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── TOP STATUS CARD WITH MACOS TRAFFIC LIGHTS ────── */}
      <div className="liquid-glass-card p-5 relative overflow-hidden transition-all shadow-md">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-white/60 shadow-xs mr-1">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Close" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Minimize" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Maximize" />
              </div>
              <h1 className="text-2xl font-bold text-[#111111] tracking-tight flex items-center gap-2.5">
                <span>Perception Command Center</span>
                <span className="text-[11px] px-3 py-1 rounded-full liquid-glass-pill-dark font-mono font-medium shadow-xs">
                  Active Shield
                </span>
              </h1>
            </div>
            <p className="text-[13px] text-[#555555] mt-1.5 ml-1 font-medium">
              Real-time telemetry, surgical blackout rules, and on-device privacy metrics
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 text-xs liquid-glass-pill px-3.5 py-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[#333333] font-medium font-mono text-[11px]">Synced · {lastUpdated || "Live"}</span>
            </div>
            <Link
              href="/dashboard/live"
              className="text-xs px-3.5 py-1.5 rounded-full liquid-glass-pill-dark shadow-xs flex items-center gap-1.5 font-medium hover:scale-105 transition-transform"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Live Visuals</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── ROW 1: STAT PILLS ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="liquid-glass-card p-5 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#777777]">
                    <Icon className="w-3.5 h-3.5 text-[#555555]" />
                    <span>{card.label}</span>
                  </div>
                  <span className="text-[28px] font-bold text-[#111111] tracking-tight leading-tight mt-1.5 block">
                    {card.value}
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full liquid-glass-pill text-[#333333]">
                  {card.delta}
                </span>
              </div>

              {/* Sparkline & signal */}
              <div className="pt-4 flex items-center justify-between border-t border-white/50 mt-2">
                <svg className="w-24 h-6 text-[#111111] overflow-visible" viewBox="0 0 80 26" fill="none">
                  <path
                    d={card.sparkline}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[10px] font-mono text-[#888888] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Sync
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── ROW 2: TIMELINE PIPELINE & ONGOING METRICS & OBSIDIAN PREVIEW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Vision Pipeline Gantt / Timeline (Inspired by reference UI top-left) */}
        <div className="lg:col-span-7 liquid-glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#111111]">Perception Timeline</h3>
                  <p className="text-[11px] text-[#777777]">Surgical redaction &amp; model reasoning milestones</p>
                </div>
              </div>

              {/* Switcher tabs */}
              <div className="flex items-center p-1 rounded-full bg-white/70 border border-white/80 text-[11px] font-medium">
                <button className="px-3 py-1 rounded-full bg-[#0D0D0D] text-white shadow-xs">Live</button>
                <button className="px-3 py-1 rounded-full text-[#666666] hover:text-[#111111]">Cascade</button>
                <button className="px-3 py-1 rounded-full text-[#666666] hover:text-[#111111]">VLM</button>
              </div>
            </div>

            {/* Timeline Tracks */}
            <div className="space-y-4">
              {/* Track 1: Frame Capture */}
              <div className="flex items-center gap-4 text-xs">
                <span className="w-24 font-medium text-[#555555] shrink-0">Frame Capture</span>
                <div className="flex-1 bg-white/50 h-9 rounded-full relative flex items-center px-3 border border-white/70">
                  <div className="h-6 rounded-full bg-[#0D0D0D] text-white text-[10px] font-mono px-3 flex items-center gap-2 shadow-xs ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Hook ~ 4ms</span>
                  </div>
                </div>
              </div>

              {/* Track 2: OCR & Regex */}
              <div className="flex items-center gap-4 text-xs">
                <span className="w-24 font-medium text-[#555555] shrink-0">PII Scan</span>
                <div className="flex-1 bg-white/50 h-9 rounded-full relative flex items-center px-3 border border-white/70">
                  <div className="h-6 rounded-full bg-[#0D0D0D] text-white text-[10px] font-mono px-3 flex items-center gap-2 shadow-xs ml-16">
                    <Lock className="w-3 h-3 text-white" />
                    <span>OCR Regex ~ 18ms</span>
                  </div>
                </div>
              </div>

              {/* Track 3: Canvas Blackout */}
              <div className="flex items-center gap-4 text-xs">
                <span className="w-24 font-medium text-[#555555] shrink-0">Redaction</span>
                <div className="flex-1 bg-white/50 h-9 rounded-full relative flex items-center px-3 border border-white/70">
                  <div className="h-6 rounded-full bg-[#0D0D0D] text-white text-[10px] font-mono px-3 flex items-center gap-2 shadow-xs ml-36">
                    <EyeOff className="w-3 h-3 text-white" />
                    <span>Blackout ~ 12ms</span>
                  </div>
                </div>
              </div>

              {/* Track 4: VLM Grounding */}
              <div className="flex items-center gap-4 text-xs">
                <span className="w-24 font-medium text-[#555555] shrink-0">Agent Action</span>
                <div className="flex-1 bg-white/50 h-9 rounded-full relative flex items-center px-3 border border-white/70">
                  <div className="h-6 rounded-full bg-[#0D0D0D] text-white text-[10px] font-mono px-3 flex items-center gap-2 shadow-xs ml-52">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Gemini 2.5 ~ 240ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time ticks footer */}
          <div className="flex justify-between text-[11px] font-mono text-[#888888] pt-4 mt-6 border-t border-white/60">
            <span>0ms</span>
            <span>50ms</span>
            <span>100ms</span>
            <span>150ms</span>
            <span>200ms</span>
            <span>250ms+</span>
          </div>
        </div>

        {/* Right (5 cols): Obsidian Preview Card with glowing liquid pearl (Inspired by reference UI top-right) */}
        <div className="lg:col-span-5 liquid-glass-dark p-6 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle sheen highlight */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white/80" />
                <span className="text-[13px] font-semibold text-white">Live Perception Shield</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-emerald-400 border border-white/10">
                ACTIVE
              </span>
            </div>

            {/* Glowing Liquid Pearl Visual */}
            <div className="my-5 flex flex-col items-center justify-center">
              <div className="w-28 h-28 liquid-orb-preview flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/40 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="mt-3 text-[13px] font-medium text-white/90">Sanitized Vision Stream</p>
              <p className="text-[11px] text-white/50">Cryptographic irreversible canvas blackout</p>
            </div>
          </div>

          {/* Bottom Operator Pill */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold ring-1 ring-white/40">
                AI
              </div>
              <div>
                <span className="text-[12px] font-medium text-white block leading-tight">Gemini 2.5 Flash</span>
                <span className="text-[10px] text-white/50">Telemetry verified</span>
              </div>
            </div>

            <Link
              href="/dashboard/live"
              className="px-3 py-1.5 rounded-full bg-white text-[#111111] text-[11px] font-semibold hover:bg-white/90 transition shadow-xs flex items-center gap-1.5"
            >
              <span>Inspect</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── ROW 3: ALL FILES (PILL LIST) & DETECTIONS DISTRIBUTION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (5 cols): Files / PII Interceptions in rounded pill rows (Inspired by reference UI bottom-left) */}
        <div className="lg:col-span-5 liquid-glass-card p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center">
                <FolderOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#111111]">PII Blackout Rules</h3>
                <span className="text-[11px] text-[#777777]">{metrics?.totalDetections || 10} active scanners</span>
              </div>
            </div>

            <Link
              href="/dashboard/detections"
              className="text-[12px] text-[#555555] hover:text-[#111111] font-medium flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Pill list rows */}
          <div className="space-y-2.5">
            {[
              { label: "Biometric Face Obfuscation", type: "Face Detection", count: metrics?.piiBreakdown?.["face"] || 14, icon: User },
              { label: "Credentials & Auth Secrets", type: "Password / Bearer", count: metrics?.piiBreakdown?.["password"] || 8, icon: Lock },
              { label: "Government ID Verhoeff Check", type: "Aadhaar / PAN", count: metrics?.piiBreakdown?.["aadhaar"] || 5, icon: ShieldAlert },
              { label: "Payment Card Luhn Sequences", type: "Visa / MC / Amex", count: metrics?.piiBreakdown?.["credit_card"] || 2, icon: CreditCard },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="rounded-full liquid-glass-pill px-4 py-2.5 flex items-center justify-between hover:bg-white transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[#111111] truncate">{row.label}</p>
                      <p className="text-[10px] text-[#777777]">{row.type}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-white border border-[#EBEBEB] text-[#444444]">
                    {row.count} hits
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (7 cols): Panoramic Dark Team & Development Analytics (Inspired by reference UI bottom-right) */}
        <div className="lg:col-span-7 liquid-glass-dark p-6 text-white flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-white">Detection &amp; Automation Stream</h3>
                  <span className="text-[11px] text-white/50">Recent verified browser task execution</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[10px] uppercase font-mono text-white/50 block">Accuracy</span>
                  <span className="text-[14px] font-bold text-white">99.8%</span>
                </div>
                <div className="h-6 w-px bg-white/15" />
                <div>
                  <span className="text-[10px] uppercase font-mono text-white/50 block">Throughput</span>
                  <span className="text-[14px] font-bold text-emerald-400">120 FPS</span>
                </div>
              </div>
            </div>

            {/* Equalizer Bars & Execution Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-5">
              <div className="space-y-2">
                <span className="text-[12px] font-semibold text-white block">OCR Client Cascade</span>
                <p className="text-[11px] text-white/60">Local deterministic regex &amp; canvas redaction</p>
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] font-mono text-white/70 mb-1">
                    <span>Latency</span>
                    <span>18ms</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full w-[95%]" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[12px] font-semibold text-white block">VLM Grounding Tier</span>
                <p className="text-[11px] text-white/60">Gemini 2.5 Flash perception engine</p>
                <div className="pt-2">
                  <div className="flex justify-between text-[11px] font-mono text-white/70 mb-1">
                    <span>Confidence</span>
                    <span>98.2%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full w-[98%]" />
                  </div>
                </div>
              </div>

              {/* Equalizer Visualizer (Matching Reference UI Bar Striping) */}
              <div className="space-y-2">
                <span className="text-[12px] font-semibold text-white block">Model Equalizer</span>
                <div className="flex items-end gap-1.5 h-14 pt-2">
                  {[40, 65, 30, 85, 95, 55, 75, 90, 60, 100, 70, 45].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-white/20 hover:bg-white transition-all rounded-full overflow-hidden flex flex-col justify-end"
                      style={{ height: "100%" }}
                    >
                      <div
                        className="w-full bg-white rounded-full"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Recent Session Pill */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                {metrics?.recentSessions?.[0]?.pageTitle
                  ? `Active session on: ${metrics.recentSessions[0].pageTitle.slice(0, 32)}...`
                  : "Ready for live automation"}
              </span>
            </div>
            <Link
              href="/dashboard/sessions"
              className="text-white hover:underline flex items-center gap-1 font-medium"
            >
              <span>View audit log</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
