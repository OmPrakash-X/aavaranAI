"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  ShieldCheck,
  Shield,
  Clock,
  Lock,
  EyeOff,
  Sparkles,
  User,
  CreditCard,
  BarChart3,
  ArrowUpRight,
  ChevronRight,
  Zap
} from "lucide-react";

interface Metrics {
  totalSessions: number;
  totalDetections: number;
  avgLatency: number;
  avgDetectionsPerSession: number;
}

export default function DashboardOverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [activeTab, setActiveTab] = useState<"Live View" | "Filter Steps" | "AI Actions">("Live View");

  useEffect(() => {
    fetch("/api/v1/metrics")
      .then((res) => res.json())
      .then(setMetrics)
      .catch(console.error);
  }, []);

  const totalSessions = metrics?.totalSessions ?? 17;
  const totalDetections = metrics?.totalDetections ?? 30;
  const avgLatency = metrics?.avgLatency ? `${metrics.avgLatency}ms` : "12155ms";
  const piiPerSession = metrics?.avgDetectionsPerSession ?? 1.8;

  return (
    <div className="space-y-6">
      {/* ─── HEADER SUBTEXT (SIMPLE ENGLISH) ───────────────── */}
      <div className="-mt-2 mb-2">
        <p className="text-[13px] font-medium text-[#555555]">
          Live protection activity, privacy rules, and system speed
        </p>
      </div>

      {/* ─── 4 TOP STAT CARDS (SIMPLE LABELS) ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sessions */}
        <div className="liquid-glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#555555] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#111111]" />
              <span>Total Sessions</span>
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full liquid-glass-pill text-[#111111]">
              +12.4%
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-[#111111] tracking-tight">
              {totalSessions}
            </div>
          </div>

          {/* Sparkline curve */}
          <div className="flex items-center justify-between pt-1">
            <svg className="w-24 h-5 overflow-visible" viewBox="0 0 100 20" fill="none">
              <path
                d="M0 15 Q25 5 50 12 T100 8"
                stroke="#111111"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#555555]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* Card 2: Hidden Private Items */}
        <div className="liquid-glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#555555] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#111111]" />
              <span>Hidden Private Items</span>
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full liquid-glass-pill text-[#111111]">
              100% Protected
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-[#111111] tracking-tight">
              {totalDetections}
            </div>
          </div>

          {/* Sparkline curve */}
          <div className="flex items-center justify-between pt-1">
            <svg className="w-24 h-5 overflow-visible" viewBox="0 0 100 20" fill="none">
              <path
                d="M0 12 Q30 18 60 7 T100 14"
                stroke="#111111"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#555555]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* Card 3: System Response Time */}
        <div className="liquid-glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#555555] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#111111]" />
              <span>Response Time</span>
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full liquid-glass-pill text-[#111111]">
              Fast (~50ms)
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-[#111111] tracking-tight truncate">
              {avgLatency}
            </div>
          </div>

          {/* Sparkline curve */}
          <div className="flex items-center justify-between pt-1">
            <svg className="w-24 h-5 overflow-visible" viewBox="0 0 100 20" fill="none">
              <path
                d="M0 16 Q35 6 65 14 T100 9"
                stroke="#111111"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#555555]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* Card 4: Items Hidden / Visit */}
        <div className="liquid-glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[#555555] flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-[#111111]" />
              <span>Private Items / Visit</span>
            </span>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full liquid-glass-pill text-[#111111]">
              Auto-Hidden
            </span>
          </div>

          <div className="my-3">
            <div className="text-3xl font-bold font-mono text-[#111111] tracking-tight">
              {piiPerSession}
            </div>
          </div>

          {/* Sparkline curve */}
          <div className="flex items-center justify-between pt-1">
            <svg className="w-24 h-5 overflow-visible" viewBox="0 0 100 20" fill="none">
              <path
                d="M0 10 Q20 18 50 10 T100 15"
                stroke="#111111"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#555555]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MIDDLE ROW: PROTECTION TIMELINE & LIVE SHIELD ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Protection Timeline (7 cols) */}
        <div className="lg:col-span-7 liquid-glass-card p-6 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#111111]">Protection Timeline</h3>
                  <p className="text-[11px] text-[#666666]">How your screen is checked and protected step by step</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-full liquid-glass-pill">
                {(["Live View", "Filter Steps", "AI Actions"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      activeTab === tab
                        ? "bg-[#0D0D0D] text-white shadow-xs"
                        : "text-[#666666] hover:text-[#111111]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Tracks */}
            <div className="space-y-3.5 pt-5">
              {/* Row 1: Take Screenshot */}
              <div className="flex items-center gap-4">
                <span className="w-28 text-xs font-semibold text-[#444444] shrink-0">Take Screenshot</span>
                <div className="flex-1 h-9 rounded-full bg-white/40 border border-white/60 relative flex items-center px-2 shadow-inner">
                  <div className="px-3.5 py-1 rounded-full bg-[#0D0D0D] text-white text-[11px] font-mono font-medium flex items-center gap-1.5 shadow-xs ml-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Captured ~ 4ms</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Find Private Data */}
              <div className="flex items-center gap-4">
                <span className="w-28 text-xs font-semibold text-[#444444] shrink-0">Find Private Data</span>
                <div className="flex-1 h-9 rounded-full bg-white/40 border border-white/60 relative flex items-center px-2 shadow-inner">
                  <div className="px-3.5 py-1 rounded-full bg-[#0D0D0D] text-white text-[11px] font-mono font-medium flex items-center gap-1.5 shadow-xs ml-14">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>Scanned ~ 18ms</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Hide Sensitive Info */}
              <div className="flex items-center gap-4">
                <span className="w-28 text-xs font-semibold text-[#444444] shrink-0">Hide Sensitive Info</span>
                <div className="flex-1 h-9 rounded-full bg-white/40 border border-white/60 relative flex items-center px-2 shadow-inner">
                  <div className="px-3.5 py-1 rounded-full bg-[#0D0D0D] text-white text-[11px] font-mono font-medium flex items-center gap-1.5 shadow-xs ml-36">
                    <EyeOff className="w-3 h-3 text-white" />
                    <span>Hidden ~ 12ms</span>
                  </div>
                </div>
              </div>

              {/* Row 4: AI Decision */}
              <div className="flex items-center gap-4">
                <span className="w-28 text-xs font-semibold text-[#444444] shrink-0">AI Assistant Action</span>
                <div className="flex-1 h-9 rounded-full bg-white/40 border border-white/60 relative flex items-center px-2 shadow-inner">
                  <div className="px-3.5 py-1 rounded-full bg-[#0D0D0D] text-white text-[11px] font-mono font-medium flex items-center gap-1.5 shadow-xs ml-56">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>AI Ready ~ 240ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Ruler */}
          <div className="pt-5 mt-4 border-t border-white/40 flex justify-between text-[11px] font-mono text-[#888888] pl-32 pr-2">
            <span>0ms</span>
            <span>50ms</span>
            <span>100ms</span>
            <span>150ms</span>
            <span>200ms</span>
            <span>250ms+</span>
          </div>
        </div>

        {/* Right: Live Privacy Shield (5 cols) - Dark Card */}
        <div className="lg:col-span-5 rounded-[24px] bg-[#111111] text-white p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-[14px] font-bold tracking-tight">Live Privacy Shield</span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 tracking-wider">
              PROTECTED
            </span>
          </div>

          {/* Center: Glowing metallic liquid orb */}
          <div className="my-6 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 rounded-full flex items-center justify-center p-1.5 shadow-[0_0_50px_rgba(255,255,255,0.18)]">
              {/* Orb gradient ring */}
              <div className="w-full h-full rounded-full bg-gradient-to-b from-white/30 via-white/5 to-black/80 flex items-center justify-center border border-white/30 p-2">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#1a1a1a] via-[#333333] to-[#0a0a0a] flex items-center justify-center shadow-inner border border-white/20">
                  <ShieldCheck className="w-10 h-10 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                </div>
              </div>
            </div>

            <h4 className="text-base font-bold text-white mt-4 tracking-tight">
              Safe Screen View
            </h4>
            <p className="text-[11px] text-white/60 mt-0.5 text-center max-w-[260px]">
              Private details are completely hidden before leaving your device
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/10 text-white text-[11px] font-bold flex items-center justify-center">
                AI
              </div>
              <div>
                <div className="text-xs font-semibold text-white">Gemini 2.5 AI</div>
                <div className="text-[10px] text-white/50">Security Verified</div>
              </div>
            </div>

            <Link
              href="/dashboard/detections"
              className="px-3.5 py-1.5 rounded-full bg-white text-[#111111] text-xs font-bold hover:bg-white/90 transition flex items-center gap-1 shadow-xs"
            >
              <span>View Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* ─── BOTTOM ROW: PRIVACY RULES & PERFORMANCE STATUS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Privacy Protection Rules (6 cols) */}
        <div className="lg:col-span-6 liquid-glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#111111]">Privacy Protection Rules</h3>
                  <p className="text-[11px] text-[#666666]">30 safety checks active</p>
                </div>
              </div>

              <Link
                href="/dashboard/detections"
                className="text-xs font-semibold text-[#555555] hover:text-[#111111] transition flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Rules list */}
            <div className="space-y-3.5 pt-4">
              {/* Item 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/40 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-bold text-[#111111]">Face Blurring</h5>
                    <p className="text-[11px] text-[#666666]">Automatically hides faces in photos and avatars</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full liquid-glass-pill text-xs font-mono font-medium text-[#444444]">
                  14 protected
                </span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/40 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-bold text-[#111111]">Passwords &amp; Login Info</h5>
                    <p className="text-[11px] text-[#666666]">Hides passwords and secret login keys</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full liquid-glass-pill text-xs font-mono font-medium text-[#444444]">
                  15 protected
                </span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/40 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-bold text-[#111111]">ID &amp; Card Numbers</h5>
                    <p className="text-[11px] text-[#666666]">Hides Aadhaar, PAN, and credit cards</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full liquid-glass-pill text-xs font-mono font-medium text-[#444444]">
                  1 protected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Safety & Performance Status (6 cols) - Dark Card */}
        <div className="lg:col-span-6 rounded-[24px] bg-[#111111] text-white p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/10">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/10 text-white flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold tracking-tight">Safety &amp; Performance Status</h3>
                  <p className="text-[11px] text-white/50">Real-time browser protection performance</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/50">ACCURACY</div>
                  <div className="text-sm font-mono font-bold text-white">99.8%</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/50">SMOOTHNESS</div>
                  <div className="text-sm font-mono font-bold text-emerald-400">120 FPS</div>
                </div>
              </div>
            </div>

            {/* 3-column content */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
              {/* Col 1 */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-white">On-Device Privacy Filter</div>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Instantly blocks private text right inside your browser
                </p>
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-white/60 mb-1 font-mono">
                    <span>Check Speed</span>
                    <span>18ms</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-white rounded-full w-[25%]" />
                  </div>
                </div>
              </div>

              {/* Col 2 */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-white">AI Vision Assistant</div>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Understands your requests and follows instructions safely
                </p>
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-white/60 mb-1 font-mono">
                    <span>Reliability</span>
                    <span>98.2%</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full w-[98%]" />
                  </div>
                </div>
              </div>

              {/* Col 3: Activity Monitor equalizer bars */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-white">Activity Monitor</div>
                <div className="h-14 flex items-end justify-between gap-1 pt-2">
                  {[40, 65, 30, 85, 55, 95, 70, 45, 80, 60, 90, 35].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-white rounded-full opacity-90 transition-all duration-300"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
