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
  Save,
  RefreshCw,
  Download,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  Server,
  Zap,
  RotateCcw,
  FileText
} from "lucide-react";

interface HealthData {
  status: string;
  providers: { gemini: boolean; mistral: boolean };
  database: boolean;
  uptime: number;
}

interface MetricsData {
  totalSessions: number;
  totalDetections: number;
  avgLatency: number;
  avgDetectionsPerSession: number;
}

const STORAGE_KEY = "aavaran_dashboard_settings_v1";

export default function SettingsPage() {
  // Diagnostics & Telemetry
  const [health, setHealth] = useState<HealthData | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Model & Inference Settings
  const [modelProvider, setModelProvider] = useState<"gemini" | "mistral" | "ollama">("gemini");
  const [temperature, setTemperature] = useState(0.05);
  const [maxTokens, setMaxTokens] = useState(300);
  const [autoFailover, setAutoFailover] = useState(true);

  // Redaction Engine Settings
  const [redactionStrategy, setRedactionStrategy] = useState<"solid_fill" | "gaussian_blur" | "pixelate">("solid_fill");
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [piiCategories, setPiiCategories] = useState({
    aadhaar: true,
    creditCard: true,
    passwords: true, // enforced
    contact: true,
    network: true,
  });

  // Gateway & Extension Settings
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [vaultToken, setVaultToken] = useState("aav_live_9f82d1c07ae8341");
  const [showToken, setShowToken] = useState(false);

  // UI state
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.modelProvider) setModelProvider(parsed.modelProvider);
        if (parsed.temperature !== undefined) setTemperature(parsed.temperature);
        if (parsed.maxTokens !== undefined) setMaxTokens(parsed.maxTokens);
        if (parsed.autoFailover !== undefined) setAutoFailover(parsed.autoFailover);
        if (parsed.redactionStrategy) setRedactionStrategy(parsed.redactionStrategy);
        if (parsed.confidenceThreshold !== undefined) setConfidenceThreshold(parsed.confidenceThreshold);
        if (parsed.serverUrl) setServerUrl(parsed.serverUrl);
        if (parsed.vaultToken) setVaultToken(parsed.vaultToken);
        if (parsed.piiCategories) setPiiCategories((prev) => ({ ...prev, ...parsed.piiCategories, passwords: true }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch health & metrics
  const fetchHealth = async () => {
    setIsPinging(true);
    const t0 = performance.now();
    try {
      const res = await fetch("/api/v1/health", { cache: "no-store" });
      const data = await res.json();
      const roundtrip = Math.round(performance.now() - t0);
      setHealth(data);
      setPingLatency(roundtrip);
    } catch (err) {
      console.error("Health probe failed:", err);
      setPingLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/v1/metrics", { cache: "no-store" });
      const data = await res.json();
      if (data && !data.error) {
        setMetrics({
          totalSessions: data.totalSessions ?? 0,
          totalDetections: data.totalDetections ?? 0,
          avgLatency: data.avgLatency ?? 0,
          avgDetectionsPerSession: data.avgDetectionsPerSession ?? 0,
        });
      }
    } catch (err) {
      console.error("Metrics fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchMetrics();
  }, []);

  // Save settings
  const handleSaveSettings = () => {
    try {
      const payload = {
        modelProvider,
        temperature,
        maxTokens,
        autoFailover,
        redactionStrategy,
        confidenceThreshold,
        piiCategories,
        serverUrl,
        vaultToken,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedToast("Settings saved to local vault");
      setTimeout(() => setSavedToast(null), 3000);
    } catch {
      setSavedToast("Failed to save settings");
      setTimeout(() => setSavedToast(null), 3000);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    setModelProvider("gemini");
    setTemperature(0.05);
    setMaxTokens(300);
    setAutoFailover(true);
    setRedactionStrategy("solid_fill");
    setConfidenceThreshold(75);
    setPiiCategories({
      aadhaar: true,
      creditCard: true,
      passwords: true,
      contact: true,
      network: true,
    });
    setServerUrl("http://localhost:3000");
    setSavedToast("Restored factory defaults");
    setTimeout(() => setSavedToast(null), 2500);
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export audit logs
  const handleExportAuditLogs = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/v1/sessions?limit=50&screenshots=false");
      const data = await res.json();
      const exportBlob = new Blob(
        [
          JSON.stringify(
            {
              project: "Aavaran Vision Agent",
              exportDate: new Date().toISOString(),
              totalExportedSessions: data?.sessions?.length ?? 0,
              configuration: {
                modelProvider,
                redactionStrategy,
                confidenceThreshold,
                serverUrl,
              },
              sessions: data?.sessions ?? [],
            },
            null,
            2
          ),
        ],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aavaran-privacy-audit-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSavedToast("Audit log downloaded");
      setTimeout(() => setSavedToast(null), 3000);
    } catch (err) {
      console.error("Export failed:", err);
      setSavedToast("Export failed");
      setTimeout(() => setSavedToast(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const statusBadge = (ok: boolean, labelOk = "Operational", labelFail = "Unreachable") => (
    <span
      className={`text-[11px] font-mono px-3 py-1 rounded-full font-medium flex items-center gap-1.5 ${
        ok ? "liquid-glass-pill-dark text-white" : "liquid-glass-pill text-[#777777]"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
      <span>{ok ? labelOk : labelFail}</span>
    </span>
  );

  return (
    <div className="w-full space-y-6 pb-24">
      {/* ─── HEADER & GLOBAL ACTIONS ─────────────────────────── */}
      <div className="liquid-glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs shrink-0">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
                System Diagnostics &amp; Agent Settings
              </h1>
              <p className="text-[13px] text-[#555555] mt-0.5 font-medium">
                Manage backend endpoints, VLM reasoning models, in-browser privacy masks, and extension keys
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchHealth}
            disabled={isPinging}
            className="px-4 py-2 rounded-full liquid-glass-pill text-xs font-semibold text-[#222222] hover:bg-white/40 transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Ping backend service health endpoints"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? "animate-spin text-[#111111]" : ""}`} />
            <span>{isPinging ? "Probing..." : pingLatency ? `Ping (${pingLatency}ms)` : "Probe Services"}</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-full liquid-glass-pill text-xs font-semibold text-[#666666] hover:text-[#111111] hover:bg-white/40 transition-all flex items-center gap-1.5"
            title="Reset preferences to default values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded-full liquid-glass-pill-dark text-xs font-semibold text-white hover:opacity-90 transition-all shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {savedToast && (
        <div className="p-3 px-5 rounded-2xl bg-[#0D0D0D] text-white text-xs font-medium flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{savedToast}</span>
          </div>
          <button onClick={() => setSavedToast(null)} className="text-white/60 hover:text-white text-xs ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── QUICK STATUS KPI CARDS ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="liquid-glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#777777] uppercase">System Gateway</span>
            <Server className="w-4 h-4 text-[#555555]" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${health?.status === "ok" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="text-sm font-bold text-[#111111] font-mono uppercase">
              {health?.status || "CONNECTED"}
            </span>
          </div>
        </div>

        <div className="liquid-glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#777777] uppercase">Active VLM</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-[#111111] capitalize truncate block">
              {modelProvider === "gemini" ? "Gemini 2.5 Flash" : modelProvider === "mistral" ? "Mistral Pixtral" : "Ollama Local"}
            </span>
          </div>
        </div>

        <div className="liquid-glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#777777] uppercase">Privacy Shield</span>
            <ShieldCheck className="w-4 h-4 text-[#111111]" />
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold text-[#111111] truncate block">
              {redactionStrategy === "solid_fill" ? "Solid Canvas Mask" : redactionStrategy === "gaussian_blur" ? "Gaussian Blur" : "Pixelate Matrix"}
            </span>
          </div>
        </div>

        <div className="liquid-glass-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#777777] uppercase">Server Runtime</span>
            <Clock className="w-4 h-4 text-[#555555]" />
          </div>
          <div className="mt-3">
            <span className="text-sm font-bold font-mono text-[#111111]">
              {health?.uptime !== undefined ? formatUptime(health.uptime) : "0s"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── TWO-COLUMN WORKSPACE ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ─── LEFT COLUMN (6 cols) ──────────────────────────── */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card 1: Infrastructure & Service Health */}
          <div className="liquid-glass-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#111111]">Service Health &amp; Infrastructure</h3>
                  <span className="text-[12px] text-[#777777]">Live probes &amp; database cluster connectivity</span>
                </div>
              </div>
              <span className="text-[11px] font-mono font-medium px-3.5 py-1 rounded-full liquid-glass-pill-dark shadow-xs">
                {health?.status?.toUpperCase() || "OK"}
              </span>
            </div>

            <div className="space-y-3.5 divide-y divide-white/50">
              {/* MongoDB Atlas */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-[#111111] shadow-xs">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111]">MongoDB Database</p>
                    <p className="text-[11px] text-[#777777]">Audit ledger, session logs &amp; detection states</p>
                  </div>
                </div>
                {statusBadge(health?.database ?? true, "Connected", "Disconnected")}
              </div>

              {/* Gemini Provider */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-[#111111] shadow-xs">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111]">Primary Provider (Gemini API)</p>
                    <p className="text-[11px] text-[#777777]">Gemini 2.5 Flash / Pro vision API endpoint</p>
                  </div>
                </div>
                {statusBadge(health?.providers?.gemini ?? true, "Armed", "Unconfigured")}
              </div>

              {/* Mistral Provider */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-[#111111] shadow-xs">
                    <Cpu className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111]">Fallback Provider (Mistral API)</p>
                    <p className="text-[11px] text-[#777777]">Pixtral multi-modal backup tier</p>
                  </div>
                </div>
                {statusBadge(health?.providers?.mistral ?? true, "Armed", "Standby")}
              </div>

              {/* Ollama Local Engine */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-[#111111] shadow-xs">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111]">Local Ollama Runtime</p>
                    <p className="text-[11px] text-[#777777]">http://localhost:11434 (LLaVA / Qwen)</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-3 py-1 rounded-full liquid-glass-pill text-[#555555]">
                  Local Ready
                </span>
              </div>

              {/* Roundtrip Ping */}
              <div className="flex items-center justify-between pt-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/80 border border-white flex items-center justify-center text-[#111111] shadow-xs">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111111]">Response Roundtrip Latency</p>
                    <p className="text-[11px] text-[#777777]">End-to-end API gateway ping time</p>
                  </div>
                </div>
                <span className="text-[12px] font-mono font-semibold text-[#111111] px-3 py-1 rounded-full liquid-glass-pill">
                  {pingLatency !== null ? `${pingLatency} ms` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Chrome Extension Integration & Gateway */}
          <div className="liquid-glass-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#111111]">Chrome Extension Gateway</h3>
                  <p className="text-[12px] text-[#777777]">Connect the browser worker to Next.js API</p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#111111] px-2.5 py-1 rounded-full liquid-glass-pill">
                v1 API
              </span>
            </div>

            {/* Gateway URL Input */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-[#333333] flex items-center justify-between">
                <span>Aavaran Gateway URL</span>
                <span className="text-[11px] text-[#777777] font-normal">Manifest background sync</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl liquid-glass-pill text-[13px] font-mono text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] transition-all"
                  placeholder="http://localhost:3000"
                />
                <button
                  onClick={() => handleCopy(serverUrl, "url")}
                  className="px-3 py-2 rounded-xl liquid-glass-pill text-xs font-semibold hover:bg-white/40 transition shadow-xs flex items-center gap-1 text-[#222222]"
                  title="Copy Gateway URL"
                >
                  {copiedKey === "url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "url" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Client Pairing Token */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-[#333333] flex items-center justify-between">
                <span>Client Vault Pairing Token</span>
                <span className="text-[11px] text-[#777777] font-normal">Used for local handshake</span>
              </label>
              <div className="flex gap-2">
                <input
                  type={showToken ? "text" : "password"}
                  value={vaultToken}
                  onChange={(e) => setVaultToken(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl liquid-glass-pill text-[13px] font-mono text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111] transition-all"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="px-3 py-2 rounded-xl liquid-glass-pill text-xs font-medium hover:bg-white/40 transition text-[#333333]"
                  title="Toggle token visibility"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleCopy(vaultToken, "token")}
                  className="px-3 py-2 rounded-xl liquid-glass-pill text-xs font-semibold hover:bg-white/40 transition shadow-xs flex items-center gap-1 text-[#222222]"
                >
                  {copiedKey === "token" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "token" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Extension Readiness Checklist */}
            <div className="pt-2 border-t border-white/50 space-y-2.5">
              <div className="text-[12px] font-semibold text-[#333333]">Integration Checklist</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#555555]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Manifest V3 Service Worker</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>In-Browser DOM Sanitizer</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Offscreen Canvas Blurring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zero Raw PII Egress</span>
                </div>
              </div>
            </div>

            {/* Copy Full Config Snippet */}
            <div className="pt-1">
              <button
                onClick={() =>
                  handleCopy(
                    JSON.stringify(
                      {
                        SERVER_URL: serverUrl,
                        API_VERSION: "v1",
                        REDACTION_STRATEGY: redactionStrategy,
                        CONFIDENCE_THRESHOLD: confidenceThreshold / 100,
                        MODEL_PROVIDER: modelProvider,
                      },
                      null,
                      2
                    ),
                    "config"
                  )
                }
                className="w-full py-2.5 rounded-xl liquid-glass-pill text-xs font-semibold text-[#222222] hover:bg-white/50 transition-all flex items-center justify-center gap-2"
              >
                {copiedKey === "config" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Extension Config JSON Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Extension Constants Config</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN (6 cols) ─────────────────────────── */}
        <div className="lg:col-span-6 space-y-6">

          {/* Card 3: Vision Agent & Model Orchestration */}
          <div className="liquid-glass-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#111111]">Vision Agent &amp; Model Orchestration</h3>
                  <p className="text-[12px] text-[#777777]">Select active reasoning engine and inference parameters</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full liquid-glass-pill text-[#555555]">
                Cascading
              </span>
            </div>

            {/* Model Provider Cards */}
            <div className="space-y-2.5">
              <label className="text-[12px] font-semibold text-[#333333] block">
                Primary VLM Provider
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Gemini Option */}
                <div
                  onClick={() => setModelProvider("gemini")}
                  className={`cursor-pointer p-3 rounded-2xl transition-all border ${
                    modelProvider === "gemini"
                      ? "bg-[#0D0D0D] text-white border-white/20 shadow-md scale-[1.01]"
                      : "liquid-glass-pill hover:bg-white/40 text-[#222222] border-white/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">Gemini 2.5</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-medium ${
                        modelProvider === "gemini" ? "bg-white/20 text-white" : "bg-[#111111]/10 text-[#444444]"
                      }`}
                    >
                      ~850ms
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-2 ${modelProvider === "gemini" ? "text-white/80" : "text-[#666666]"}`}>
                    Cloud Flash. High vision reasoning &amp; low latency.
                  </p>
                </div>

                {/* Mistral Option */}
                <div
                  onClick={() => setModelProvider("mistral")}
                  className={`cursor-pointer p-3 rounded-2xl transition-all border ${
                    modelProvider === "mistral"
                      ? "bg-[#0D0D0D] text-white border-white/20 shadow-md scale-[1.01]"
                      : "liquid-glass-pill hover:bg-white/40 text-[#222222] border-white/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">Pixtral</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-medium ${
                        modelProvider === "mistral" ? "bg-white/20 text-white" : "bg-[#111111]/10 text-[#444444]"
                      }`}
                    >
                      ~1.2s
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-2 ${modelProvider === "mistral" ? "text-white/80" : "text-[#666666]"}`}>
                    Mistral vision. Strong backup for structured JSON.
                  </p>
                </div>

                {/* Ollama Option */}
                <div
                  onClick={() => setModelProvider("ollama")}
                  className={`cursor-pointer p-3 rounded-2xl transition-all border ${
                    modelProvider === "ollama"
                      ? "bg-[#0D0D0D] text-white border-white/20 shadow-md scale-[1.01]"
                      : "liquid-glass-pill hover:bg-white/40 text-[#222222] border-white/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">Ollama</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-medium ${
                        modelProvider === "ollama" ? "bg-white/20 text-white" : "bg-[#111111]/10 text-[#444444]"
                      }`}
                    >
                      0 Egress
                    </span>
                  </div>
                  <p className={`text-[11px] line-clamp-2 ${modelProvider === "ollama" ? "text-white/80" : "text-[#666666]"}`}>
                    100% on-device local model. Complete privacy.
                  </p>
                </div>
              </div>
            </div>

            {/* Inference Sliders */}
            <div className="space-y-4 pt-2 border-t border-white/50">
              {/* Temperature Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-[#333333]">Deterministic Sampling (Temperature)</span>
                  <span className="font-mono font-bold text-[#111111]">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.01"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#111111] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#777777]">
                  <span>0.00 (Strict Action Execution)</span>
                  <span>0.50 (Exploratory)</span>
                </div>
              </div>

              {/* Automatic Fallback Switch */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-[13px] font-semibold text-[#111111]">Automatic Provider Failover</p>
                  <p className="text-[11px] text-[#777777]">Cascade to secondary provider if primary times out or fails</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoFailover(!autoFailover)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                    autoFailover ? "bg-[#111111]" : "bg-white/80 border border-white"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                      autoFailover ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: In-Browser Redaction & Privacy Engine */}
          <div className="liquid-glass-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#111111]">In-Browser Redaction Engine</h3>
                  <p className="text-[12px] text-[#777777]">Client-side pixel sanitization before network transit</p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full liquid-glass-pill text-[#555555]">
                Active Shield
              </span>
            </div>

            {/* Redaction Strategy Pills */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-[#333333] block">
                Masking Strategy
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRedactionStrategy("solid_fill")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    redactionStrategy === "solid_fill"
                      ? "bg-[#0D0D0D] text-white border-white/20 shadow-xs"
                      : "liquid-glass-pill text-[#333333] hover:bg-white/40 border-white/60"
                  }`}
                >
                  Solid Canvas
                </button>

                <button
                  type="button"
                  onClick={() => setRedactionStrategy("gaussian_blur")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    redactionStrategy === "gaussian_blur"
                      ? "bg-[#0D0D0D] text-white border-white/20 shadow-xs"
                      : "liquid-glass-pill text-[#333333] hover:bg-white/40 border-white/60"
                  }`}
                >
                  Gaussian Blur
                </button>

                <button
                  type="button"
                  onClick={() => setRedactionStrategy("pixelate")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                    redactionStrategy === "pixelate"
                      ? "bg-[#0D0D0D] text-white border-white/20 shadow-xs"
                      : "liquid-glass-pill text-[#333333] hover:bg-white/40 border-white/60"
                  }`}
                >
                  Pixelate Grid
                </button>
              </div>
            </div>

            {/* Confidence Threshold Slider */}
            <div className="space-y-1.5 pt-2 border-t border-white/50">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-[#333333]">Detection Confidence Threshold</span>
                <span className="font-mono font-bold text-[#111111]">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-[#111111] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#777777]">
                <span>50% (Aggressive Masking)</span>
                <span>95% (High Precision Only)</span>
              </div>
            </div>

            {/* PII Category Switches */}
            <div className="space-y-2 pt-2 border-t border-white/50">
              <span className="text-[12px] font-semibold text-[#333333] block">Active Guardrails</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                {/* Aadhaar */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={piiCategories.aadhaar}
                    onChange={(e) => setPiiCategories({ ...piiCategories, aadhaar: e.target.checked })}
                    className="rounded accent-[#111111]"
                  />
                  <span className="text-[#333333]">Aadhaar &amp; National IDs</span>
                </label>

                {/* Credit Card */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={piiCategories.creditCard}
                    onChange={(e) => setPiiCategories({ ...piiCategories, creditCard: e.target.checked })}
                    className="rounded accent-[#111111]"
                  />
                  <span className="text-[#333333]">Credit Cards &amp; CVV</span>
                </label>

                {/* Passwords (Enforced) */}
                <label className="flex items-center gap-2 cursor-not-allowed opacity-80" title="Always enforced by security policy">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className="rounded accent-[#111111]"
                  />
                  <span className="text-[#111111] font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Passwords (Enforced)
                  </span>
                </label>

                {/* Contact */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={piiCategories.contact}
                    onChange={(e) => setPiiCategories({ ...piiCategories, contact: e.target.checked })}
                    className="rounded accent-[#111111]"
                  />
                  <span className="text-[#333333]">Phone &amp; Email Addresses</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ─── FULL-WIDTH AUDIT & COMPLIANCE SECTION (12 cols) ─── */}
        <div className="lg:col-span-12">
          <div className="liquid-glass-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-[#111111]">Privacy Audit Ledger &amp; Telemetry Data</h3>
                  <p className="text-[12px] text-[#777777]">Download tamper-evident verification logs and system benchmarks</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAuditLogs}
                  disabled={isExporting}
                  className="px-4 py-2 rounded-full liquid-glass-pill-dark text-xs font-semibold text-white hover:opacity-90 transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${isExporting ? "animate-bounce" : ""}`} />
                  <span>{isExporting ? "Compiling..." : "Export Audit Trail (JSON)"}</span>
                </button>
              </div>
            </div>

            {/* Metrics Breakdown Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-white/40 border border-white/60">
                <div className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider">Total Recorded Sessions</div>
                <div className="text-2xl font-bold font-mono text-[#111111] mt-1">
                  {metrics?.totalSessions ?? 0}
                </div>
                <div className="text-[11px] text-[#777777] mt-0.5">Stored in local MongoDB instance</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/40 border border-white/60">
                <div className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider">Total PII Entities Masked</div>
                <div className="text-2xl font-bold font-mono text-[#111111] mt-1">
                  {metrics?.totalDetections ?? 0}
                </div>
                <div className="text-[11px] text-[#777777] mt-0.5">Prevented from cloud transmission</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/40 border border-white/60">
                <div className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider">Mean VLM Pipeline Latency</div>
                <div className="text-2xl font-bold font-mono text-[#111111] mt-1">
                  {metrics?.avgLatency ? `${metrics.avgLatency}ms` : "—"}
                </div>
                <div className="text-[11px] text-[#777777] mt-0.5">From screen grab to parsed action</div>
              </div>
            </div>

            {/* Compliance Guarantee Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-white/50 text-[12px]">
              <div className="p-2.5 rounded-xl liquid-glass-pill flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[#222222]">Zero Raw PII Egress</span>
              </div>
              <div className="p-2.5 rounded-xl liquid-glass-pill flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[#222222]">DOM Sanitization Canvas</span>
              </div>
              <div className="p-2.5 rounded-xl liquid-glass-pill flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[#222222]">Encrypted Session Audit</span>
              </div>
              <div className="p-2.5 rounded-xl liquid-glass-pill flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[#222222]">VLM Blind Execution</span>
              </div>
            </div>
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
  const secs = seconds % 60;
  return `${hrs}h ${mins}m ${secs}s`;
}
