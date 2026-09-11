"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  User,
  Lock,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Globe
} from "lucide-react";

interface RecentSession {
  _id: string;
  sessionId?: string;
  pageTitle?: string;
  pageDomain?: string;
  totalDetections: number;
  detections?: Array<{ type: string; confidence?: number; strategy?: string }>;
  action?: { action: string; reasoning: string; selector?: string; value?: string | null };
  createdAt: string;
}

interface Metrics {
  totalSessions: number;
  totalDetections: number;
  avgLatency: number;
  avgDetectionsPerSession: number;
  piiBreakdown: Record<string, number>;
  providerUsage: Record<string, number>;
  recentSessions: RecentSession[];
}

const DETECTOR_DEFINITIONS = [
  { key: "email", label: "Email Addresses", category: "Direct PII", icon: Mail },
  { key: "password", label: "Passwords & Auth Secrets", category: "Authentication", icon: Lock },
  { key: "phone", label: "Phone Numbers", category: "Direct PII", icon: Phone },
  { key: "credit_card", label: "Payment Cards", category: "Financial", icon: CreditCard },
  { key: "face", label: "Face Detection", category: "Biometric", icon: User },
  { key: "aadhaar", label: "Aadhaar Numbers", category: "Government ID", icon: ShieldAlert },
  { key: "pan", label: "PAN Cards", category: "Government ID", icon: FileText },
  { key: "name", label: "Person Names", category: "Identity", icon: User },
  { key: "address", label: "Physical Addresses", category: "Identity", icon: MapPin },
  { key: "dob", label: "Date of Birth", category: "Identity", icon: Calendar },
];

export default function DetectionsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/metrics")
      .then(async (res) => {
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data) => {
        if (data) setMetrics(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 rounded-[24px] liquid-glass-card animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-[20px] liquid-glass-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalDetected = metrics?.totalDetections || 0;
  const piiBreakdown = metrics?.piiBreakdown || {};
  const activeCategoriesCount = Object.keys(piiBreakdown).length;
  const sessionsWithPii = (metrics?.recentSessions || []).filter((s) => s.totalDetections > 0);

  return (
    <div className="space-y-6">
      {/* ─── HEADER (CLEAN & MINIMAL) ─────────────────────────── */}
      <div className="liquid-glass-card p-5 relative overflow-hidden transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
              PII Detection Registry
            </h1>
          </div>
          <p className="text-[13px] text-[#555555] mt-1.5 ml-1 font-medium">
            Real-time privacy masking, regex scanners, and on-device interception metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3.5 py-1.5 rounded-full liquid-glass-pill-dark font-mono font-medium shadow-xs">
            10 Scanners Armed
          </span>
        </div>
      </div>

      {/* ─── DYNAMIC SUMMARY CARDS ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-card p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[12px] font-medium text-[#666666]">Total Masked Entities</span>
              <span className="text-[28px] font-bold text-[#111111] tracking-tight block leading-tight">
                {totalDetected}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full liquid-glass-pill text-[#333333]">
            Live
          </span>
        </div>

        <div className="liquid-glass-card p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs shrink-0">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[12px] font-medium text-[#666666]">Active PII Categories</span>
              <span className="text-[28px] font-bold text-[#111111] tracking-tight block leading-tight">
                {activeCategoriesCount}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full liquid-glass-pill text-[#333333]">
            Triggered
          </span>
        </div>

        <div className="liquid-glass-card p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[12px] font-medium text-[#666666]">PII per Session</span>
              <span className="text-[28px] font-bold text-[#111111] tracking-tight block leading-tight">
                {metrics?.avgDetectionsPerSession ? metrics.avgDetectionsPerSession.toFixed(1) : "0.0"}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-full liquid-glass-pill text-[#333333]">
            Average
          </span>
        </div>
      </div>

      {/* ─── REAL DETECTIONS LOGS (FROM REAL BROWSER SESSIONS) ─ */}
      <div className="liquid-glass-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/50">
          <div>
            <h2 className="text-[16px] font-bold text-[#111111]">Recent PII Redaction Events</h2>
            <p className="text-[12px] text-[#666666]">Live records of intercepted sensitive information in web sessions</p>
          </div>
          <span className="text-[11px] font-mono text-[#777777]">
            {sessionsWithPii.length} sessions protected
          </span>
        </div>

        {sessionsWithPii.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[#777777]">
            No sensitive PII has been encountered in recent sessions yet. Active scanners are running.
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessionsWithPii.slice(0, 5).map((session) => (
              <div
                key={session._id}
                className="rounded-2xl liquid-glass-pill p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition-all shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-bold text-[#111111] truncate">
                      {session.pageTitle || session.pageDomain || "Browser Session"}
                    </span>
                    {session.pageDomain && (
                      <span className="text-[11px] text-[#777777] font-mono flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#999999]" />
                        <span>{session.pageDomain}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#666666] line-clamp-1 mt-0.5">
                    {session.action?.reasoning || "Sensitive values redacted from client DOM."}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-500/10 text-red-700 border border-red-500/20 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-red-500" />
                    <span>{session.totalDetections} Masked</span>
                  </span>

                  <span className="text-[11px] font-mono text-[#888888]">
                    {session.createdAt ? new Date(session.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>

                  <Link
                    href="/dashboard/live"
                    className="p-1.5 rounded-full bg-black/5 hover:bg-black/10 text-[#111111] transition"
                    title="View in Live Feed"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── ACTIVE SCANNERS REGISTRY (NO DUMMY FILLER TEXT) ──── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[15px] font-bold text-[#111111]">Armed Scanner Registry</h2>
          <span className="text-[12px] font-mono text-[#777777]">10 Detectors Active</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3.5">
          {DETECTOR_DEFINITIONS.map((det) => {
            const count = piiBreakdown[det.key] || 0;
            const isActive = count > 0;
            const Icon = det.icon;

            return (
              <div
                key={det.key}
                className="liquid-glass-card p-4 rounded-2xl flex items-center justify-between gap-3 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/50 border border-white text-[#111111] flex items-center justify-center shrink-0 shadow-xs">
                    <Icon className="w-4 h-4 text-[#222222]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-[#111111] truncate">{det.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full liquid-glass-pill text-[#666666]">
                        {det.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#777777] font-medium flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />
                      <span>{isActive ? "Active Interceptions" : "Armed & Monitoring"}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[18px] font-bold font-mono ${isActive ? "text-red-600" : "text-[#888888]"}`}>
                    {count}
                  </span>
                  <span className="text-[9px] uppercase font-mono block text-[#888888]">hits</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
