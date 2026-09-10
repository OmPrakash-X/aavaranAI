"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Database,
  Sparkles,
  Cpu,
  Clock,
  Settings as SettingsIcon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Save
} from "lucide-react";

interface HealthData {
  status: string;
  providers: { gemini: boolean; mistral: boolean };
  database: boolean;
  uptime: number;
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/v1/health")
      .then((res) => res.json())
      .then(setHealth)
      .catch(console.error);
  }, []);

  const statusBadge = (ok: boolean, labelOk = "Connected", labelFail = "Disconnected") => (
    <span
      className={`text-[11px] font-mono px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
        ok
          ? "liquid-glass-pill-dark text-white"
          : "liquid-glass-pill text-[#777777]"
      }`}
    >
      {ok ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{labelOk}</span>
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>{labelFail}</span>
        </>
      )}
    </span>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* ─── HEADER WITH MACOS TRAFFIC LIGHTS ────────────────── */}
      <div className="liquid-glass-card p-5 relative overflow-hidden transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-white/60 shadow-xs mr-1">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Close" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Minimize" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Maximize" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
              System Diagnostics &amp; Settings
            </h1>
          </div>
          <p className="text-[13px] text-[#555555] mt-1.5 ml-1 font-medium">
            Backend server status, model provider availability, and extension endpoints
          </p>
        </div>
      </div>

      {/* ─── SYSTEM STATUS CARD ─────────────────────────────── */}
      <div className="liquid-glass-card p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#111111]">Service Health</h3>
              <span className="text-[12px] text-[#777777]">Live connectivity checks</span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-medium px-3.5 py-1 rounded-full liquid-glass-pill-dark shadow-xs">
            {health?.status?.toUpperCase() || "CHECKING"}
          </span>
        </div>

        <div className="space-y-3.5 divide-y divide-white/50">
          {/* MongoDB */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-[#111111] shadow-xs">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#111111]">Database (MongoDB)</p>
                <p className="text-[11px] text-[#777777]">Session logs and detection audits storage</p>
              </div>
            </div>
            {statusBadge(health?.database || false)}
          </div>

          {/* Gemini */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-[#111111] shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#111111]">Primary Provider (Gemini API)</p>
                <p className="text-[11px] text-[#777777]">Gemini 2.5 Flash / Pro vision endpoint</p>
              </div>
            </div>
            {statusBadge(health?.providers?.gemini || false, "Armed", "Unconfigured")}
          </div>

          {/* Mistral */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-[#111111] shadow-xs">
                <Cpu className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#111111]">Fallback Provider (Mistral API)</p>
                <p className="text-[11px] text-[#777777]">Pixtral large multi-modal fallback</p>
              </div>
            </div>
            {statusBadge(health?.providers?.mistral || false, "Armed", "Unconfigured")}
          </div>

          {/* Uptime */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-[#111111] shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#111111]">Server Uptime</p>
                <p className="text-[11px] text-[#777777]">Elapsed runtime since boot</p>
              </div>
            </div>
            <span className="text-[12px] font-mono font-semibold text-[#111111] px-3 py-1 rounded-full liquid-glass-pill">
              {health ? formatUptime(health.uptime) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── EXTENSION CONFIGURATION CARD ───────────────────── */}
      <div className="liquid-glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/60">
          <div className="w-9 h-9 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
            <SettingsIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#111111]">Extension Endpoint Configuration</h3>
            <p className="text-[12px] text-[#777777]">Base URL queried by the Chrome Extension background worker</p>
          </div>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-[#444444] block mb-2">
            Aavaran Next.js Gateway URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-full liquid-glass-pill text-[13px] font-mono text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] transition-all"
            />
            <button
              onClick={() => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              className="px-5 py-2.5 rounded-full liquid-glass-pill-dark text-xs font-semibold hover:opacity-90 transition shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saved ? "Saved" : "Apply"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── SPECIFICATION & COMPLIANCE ─────────────────────── */}
      <div className="liquid-glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/60">
          <div className="w-9 h-9 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-[15px] font-bold text-[#111111]">System Architecture &amp; Privacy Standard</h3>
        </div>

        <div className="space-y-3 text-[13px] divide-y divide-white/50">
          <div className="flex justify-between pt-2">
            <span className="text-[#777777]">Design Standard</span>
            <span className="font-semibold text-[#111111]">Liquid Glass Monochrome UI v1.0</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-[#777777]">Redaction Pipeline</span>
            <span className="font-semibold text-[#111111]">4-Layer In-Browser Shield</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-[#777777]">Privacy Guarantees</span>
            <span className="font-semibold text-[#111111]">Zero PII Network Transmission</span>
          </div>
          <div className="flex justify-between pt-2">
            <span className="text-[#777777]">VLM Cascade</span>
            <span className="font-semibold text-[#111111]">Multi-tier Automatic Failover</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
}
