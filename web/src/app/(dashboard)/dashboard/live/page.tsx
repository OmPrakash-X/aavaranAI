"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  Lock,
  Zap,
  Search,
  LayoutGrid,
  Columns,
  List,
  Eye,
  ArrowUpRight,
  Globe,
  Video
} from "lucide-react";

interface DetectionItem {
  type: string;
  bbox?: { x: number; y: number; width: number; height: number };
  confidence?: number;
  detectedBy?: string;
  strategy?: string;
}

interface LiveEntry {
  id: string;
  sessionId: string;
  timestamp: string;
  data: {
    action?: string;
    selector?: string;
    value?: string | null;
    reasoning?: string;
    detections?: number;
    detectionList?: DetectionItem[];
    latency?: number;
    provider?: string;
    pageTitle?: string;
    pageDomain?: string;
    screenshotUrl?: string | null;
  };
}

const ACTION_COLORS: Record<string, { badge: string; border: string; glow: string }> = {
  click: {
    badge: "text-[#111111] bg-[#F2F2F2] border-[#EBEBEB]",
    border: "border-[#EBEBEB]",
    glow: "shadow-xs",
  },
  type: {
    badge: "text-white bg-[#111111] border-[#111111]",
    border: "border-[#EBEBEB]",
    glow: "shadow-xs",
  },
  press_key: {
    badge: "text-[#111111] bg-[#F2F2F2] border-[#EBEBEB]",
    border: "border-[#EBEBEB]",
    glow: "shadow-xs",
  },
  navigate: {
    badge: "text-[#111111] bg-[#F2F2F2] border-[#EBEBEB]",
    border: "border-[#EBEBEB]",
    glow: "shadow-xs",
  },
  scroll: {
    badge: "text-[#111111] bg-[#F2F2F2] border-[#EBEBEB]",
    border: "border-[#EBEBEB]",
    glow: "shadow-xs",
  },
  wait: {
    badge: "text-[#888888] bg-[#F7F7F7] border-[#EBEBEB]",
    border: "border-[#EBEBEB]",
    glow: "shadow-xs",
  },
  done: {
    badge: "text-white bg-[#111111] border-[#111111]",
    border: "border-[#111111]",
    glow: "shadow-sm",
  },
};

export default function LiveFeedPage() {
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [viewMode, setViewMode] = useState<"showcase" | "inspector" | "compact">("showcase");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Lightbox Modal state
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Selected entry for split Inspector view
  const [selectedInspectorId, setSelectedInspectorId] = useState<string | null>(null);

  const fetchLatest = async () => {
    try {
      const res = await fetch("/api/v1/metrics");
      if (!res.ok) throw new Error("metrics failed");
      const data = await res.json();
      setIsConnected(true);

      if (data.recentSessions?.length) {
        const formattedEntries: LiveEntry[] = data.recentSessions.map(
          (s: {
            _id: string;
            sessionId?: string;
            createdAt: string;
            action?: { action: string; selector?: string; value?: string | null; reasoning?: string };
            totalDetections: number;
            detections?: DetectionItem[];
            latency?: { totalEndToEnd: number };
            vlmProvider: string;
            pageTitle?: string;
            pageDomain?: string;
            screenshotUrl?: string | null;
            screenshotRedacted?: string | null;
          }) => ({
            id: s._id,
            sessionId: s.sessionId || "",
            timestamp: s.createdAt,
            data: {
              action: s.action?.action,
              selector: s.action?.selector,
              value: s.action?.value,
              reasoning: s.action?.reasoning,
              detections: s.totalDetections,
              detectionList: s.detections || [],
              latency: s.latency?.totalEndToEnd,
              provider: s.vlmProvider,
              pageTitle: s.pageTitle,
              pageDomain: s.pageDomain,
              screenshotUrl: s.screenshotUrl || s.screenshotRedacted || null,
            },
          })
        );

        setEntries(formattedEntries);

        // Auto-select first entry for inspector if none selected
        if (!selectedInspectorId && formattedEntries.length > 0) {
          setSelectedInspectorId(formattedEntries[0].id);
        }
      }
    } catch {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 4000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard controls for modal navigation (Esc to close, Left/Right arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeModalIndex === null) return;

      if (e.key === "Escape") {
        setActiveModalIndex(null);
        setZoomLevel(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveModalIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
        setZoomLevel(1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveModalIndex((prev) => (prev !== null && prev < filteredEntries.length - 1 ? prev + 1 : prev));
        setZoomLevel(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalIndex]);

  // Filtering & search
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filter pill check
      if (selectedFilter !== "all") {
        if (selectedFilter === "has_pii" && (entry.data.detections ?? 0) === 0) return false;
        if (selectedFilter !== "has_pii" && entry.data.action !== selectedFilter) return false;
      }

      // Text search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = entry.data.action?.toLowerCase().includes(q);
        const matchesReason = entry.data.reasoning?.toLowerCase().includes(q);
        const matchesTitle = entry.data.pageTitle?.toLowerCase().includes(q);
        const matchesSelector = entry.data.selector?.toLowerCase().includes(q);
        return matchesAction || matchesReason || matchesTitle || matchesSelector;
      }

      return true;
    });
  }, [entries, selectedFilter, searchQuery]);

  // Total stats
  const totalBlockedPII = useMemo(() => {
    return entries.reduce((acc, e) => acc + (e.data.detections || 0), 0);
  }, [entries]);

  const activeInspectorEntry = useMemo(() => {
    return entries.find((e) => e.id === selectedInspectorId) || entries[0] || null;
  }, [entries, selectedInspectorId]);

  const modalEntry = activeModalIndex !== null ? filteredEntries[activeModalIndex] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Status Bar with macOS Traffic Lights */}
      <div className="liquid-glass-card p-5 relative overflow-hidden transition-all shadow-md">
        {/* Specular soft light sheen arc */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs shrink-0">
                <Video className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-[#111111] tracking-tight">
                Live Visual Feed
              </h1>
            </div>
            <p className="text-[13px] text-[#555555] mt-1.5 ml-1 font-medium">
              Real-time visual stream of redacted screenshots and on-device privacy actions
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Summary Strip with Liquid Glass */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="liquid-glass-card p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-white/35 backdrop-blur-md border border-white/60 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#111111] leading-tight">{totalBlockedPII}</div>
            <div className="text-[11px] text-[#666666] font-medium">Total PII Masked</div>
          </div>
        </div>

        <div className="liquid-glass-card p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-white/35 backdrop-blur-md border border-white/60 text-[#111111] flex items-center justify-center shrink-0 shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#111111] leading-tight">{entries.length}</div>
            <div className="text-[11px] text-[#666666] font-medium">Captured Steps</div>
          </div>
        </div>

        <div className="liquid-glass-card p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-white/35 backdrop-blur-md border border-white/60 text-[#111111] flex items-center justify-center shrink-0 shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#111111] leading-tight">100%</div>
            <div className="text-[11px] text-[#666666] font-medium">Client Protected</div>
          </div>
        </div>

        <div className="liquid-glass-card p-4 flex items-center gap-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-white/35 backdrop-blur-md border border-white/60 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#111111] leading-tight font-mono">
              {entries.length > 0
                ? `${Math.round(entries.reduce((a, b) => a + (b.data.latency || 0), 0) / entries.length)}ms`
                : "—"}
            </div>
            <div className="text-[11px] text-[#666666] font-medium">Avg Latency</div>
          </div>
        </div>
      </div>

      {/* Filter & View Mode Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 liquid-glass-card p-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Search actions, targets, reasoning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full liquid-glass-pill rounded-full pl-9 pr-4 py-2 text-xs text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#111111]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All" },
            { id: "click", label: "Clicks" },
            { id: "type", label: "Types" },
            { id: "has_pii", label: "Masked PII" },
            { id: "done", label: "Complete" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedFilter(pill.id)}
              className={`text-xs px-3.5 py-1.5 rounded-full transition-all font-medium whitespace-nowrap ${selectedFilter === pill.id
                  ? "liquid-glass-pill-dark shadow-xs"
                  : "liquid-glass-pill text-[#666666] hover:text-[#111111]"
                }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* View Layout Mode Buttons */}
        <div className="flex items-center gap-1 liquid-glass-pill p-1 rounded-full self-end sm:self-auto">
          <button
            onClick={() => setViewMode("showcase")}
            className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 font-medium ${viewMode === "showcase" ? "bg-[#111111] text-white shadow-xs" : "text-[#777777] hover:text-[#111111]"
              }`}
            title="Large Showcase Cards"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cards</span>
          </button>

          <button
            onClick={() => setViewMode("inspector")}
            className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 font-medium ${viewMode === "inspector" ? "bg-[#111111] text-white shadow-xs" : "text-[#777777] hover:text-[#111111]"
              }`}
            title="Split Inspector View"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Inspector</span>
          </button>

          <button
            onClick={() => setViewMode("compact")}
            className={`px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1 font-medium ${viewMode === "compact" ? "bg-[#111111] text-white shadow-xs" : "text-[#777777] hover:text-[#111111]"
              }`}
            title="Compact List View"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Compact</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600 rounded-2xl border border-white/5 bg-zinc-950/40">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-zinc-400">
            <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-zinc-400">No matching activities found</p>
          <p className="text-xs mt-2 text-zinc-600 text-center max-w-sm">
            {searchQuery || selectedFilter !== "all"
              ? "Try adjusting your search or filter settings."
              : "Launch a task from the Aavaran Chrome Extension to see live visual steps here."}
          </p>
        </div>
      ) : viewMode === "inspector" ? (
        /* ============================================================ */
        /* SPLIT INSPECTOR VIEW                                         */
        /* ============================================================ */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Scrollable step list */}
          <div className="lg:col-span-5 space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredEntries.map((entry, idx) => {
              const actionCfg = ACTION_COLORS[entry.data.action || ""] || ACTION_COLORS.wait;
              const isSelected = selectedInspectorId === entry.id;

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedInspectorId(entry.id)}
                  className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3.5 ${isSelected
                      ? "bg-zinc-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                      : "bg-zinc-900/50 border-white/6 hover:bg-zinc-900 hover:border-white/12"
                    }`}
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-14 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10 relative group">
                    {entry.data.screenshotUrl ? (
                      <img
                        src={entry.data.screenshotUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">
                        No image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/20 transition-colors" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${actionCfg.badge}`}>
                        {entry.data.action || "step"}
                      </span>
                      <time className="text-[10px] text-zinc-500 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </time>
                    </div>

                    <p className="text-xs text-white/80 font-medium truncate">
                      {entry.data.pageTitle || "Web Page"}
                    </p>

                    <p className="text-[11px] text-white/50 truncate mt-0.5">
                      {entry.data.reasoning || "Executing browser step..."}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      {(entry.data.detections ?? 0) > 0 ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">
                          🛡️ {entry.data.detections} PII
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-400">✓ Safe</span>
                      )}
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {entry.data.latency ? `${entry.data.latency}ms` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Large Sticky Visual Inspector */}
          <div className="lg:col-span-7 sticky top-4 bg-zinc-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
            {activeInspectorEntry && (
              <div className="flex flex-col">
                {/* Visual Header */}
                <div className="p-4 border-b border-white/8 flex items-center justify-between gap-3 bg-black/30">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {activeInspectorEntry.data.action}
                      </span>
                      <span className="text-xs text-white/60 truncate font-mono">
                        {activeInspectorEntry.data.pageDomain || activeInspectorEntry.data.pageTitle}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const idx = filteredEntries.findIndex((e) => e.id === activeInspectorEntry.id);
                      if (idx !== -1) setActiveModalIndex(idx);
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium flex items-center gap-1.5 transition-all shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                    Full Lightbox
                  </button>
                </div>

                {/* Large Interactive Screenshot Area */}
                <div
                  onClick={() => {
                    const idx = filteredEntries.findIndex((e) => e.id === activeInspectorEntry.id);
                    if (idx !== -1) setActiveModalIndex(idx);
                  }}
                  className="relative bg-black/90 cursor-zoom-in group aspect-16/10 overflow-hidden flex items-center justify-center"
                >
                  {activeInspectorEntry.data.screenshotUrl ? (
                    <>
                      <img
                        src={activeInspectorEntry.data.screenshotUrl}
                        alt="Full Redacted Screenshot"
                        className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      {/* Top Overlay Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-400 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 shadow-lg">
                          🔒 REDACTED ON-DEVICE
                        </span>
                        <span className="text-[10px] text-white/60 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 capitalize font-mono">
                          {activeInspectorEntry.data.provider || "VLM"}
                        </span>
                      </div>

                      {/* Hover Pill */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2">
                          🔍 Click to Enlarge & Inspect
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                        📸
                      </div>
                      <p className="text-sm font-medium text-zinc-400">Processing Redacted Screenshot</p>
                      <p className="text-xs text-zinc-600 mt-1">Image will appear once captured by agent</p>
                    </div>
                  )}
                </div>

                {/* Detailed Inspector Metadata Footer */}
                <div className="p-5 space-y-3 bg-zinc-950/70 border-t border-white/6">
                  {/* Action Selector & Value Box */}
                  {(activeInspectorEntry.data.selector || activeInspectorEntry.data.value) && (
                    <div className="bg-black/50 border border-white/8 rounded-xl p-3 space-y-1.5 font-mono text-xs">
                      {activeInspectorEntry.data.selector && (
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-400 font-semibold shrink-0">Target:</span>
                          <span className="text-zinc-300 break-all">{activeInspectorEntry.data.selector}</span>
                        </div>
                      )}
                      {activeInspectorEntry.data.value && (
                        <div className="flex items-start gap-2">
                          <span className="text-emerald-400 font-semibold shrink-0">Value:</span>
                          <span className="text-zinc-300 break-all flex items-center gap-1.5">
                            {activeInspectorEntry.data.value}
                            {activeInspectorEntry.data.value.includes("<LOCAL_SECRET") && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded font-sans font-medium">
                                🛡️ Local Secret
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* VLM Reasoning */}
                  <div>
                    <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-1">
                      Agent Reasoning
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed bg-white/2 p-3 rounded-lg border border-white/4">
                      {activeInspectorEntry.data.reasoning || "No reasoning logged."}
                    </p>
                  </div>

                  {/* Redactions list */}
                  {activeInspectorEntry.data.detectionList && activeInspectorEntry.data.detectionList.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-red-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span>🛡️ Masked PII Elements</span>
                        <span className="text-[10px] bg-red-500/15 px-1.5 py-0.2 rounded text-red-400">
                          {activeInspectorEntry.data.detectionList.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeInspectorEntry.data.detectionList.map((det, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-300 font-medium"
                          >
                            {det.type} · {det.strategy || "redacted"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === "compact" ? (
        /* ============================================================ */
        /* COMPACT LIST VIEW                                            */
        /* ============================================================ */
        <div className="space-y-2">
          {filteredEntries.map((entry, idx) => {
            const actionCfg = ACTION_COLORS[entry.data.action || ""] || ACTION_COLORS.wait;

            return (
              <div
                key={entry.id}
                className="bg-zinc-900/60 border border-white/6 hover:border-white/15 rounded-xl p-3 flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Small click-to-open thumbnail */}
                  <div
                    onClick={() => setActiveModalIndex(idx)}
                    className="w-14 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 cursor-pointer hover:border-indigo-500 transition-colors relative group"
                  >
                    {entry.data.screenshotUrl ? (
                      <img src={entry.data.screenshotUrl} alt="" className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-600">N/A</div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white">
                      🔍
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${actionCfg.badge}`}>
                    {entry.data.action}
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs text-white/90 font-medium truncate">
                      {entry.data.reasoning || entry.data.pageTitle || "Step"}
                    </p>
                    <p className="text-[10px] text-white/40 truncate">
                      {entry.data.selector ? `Target: ${entry.data.selector}` : entry.data.pageDomain || ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {(entry.data.detections ?? 0) > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">
                      🛡️ {entry.data.detections}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {entry.data.latency ? `${entry.data.latency}ms` : ""}
                  </span>
                  <button
                    onClick={() => setActiveModalIndex(idx)}
                    className="text-xs px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ============================================================ */
        /* SHOWCASE CARD VIEW (Default: Big, clear, readable images)     */
        /* ============================================================ */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEntries.map((entry, idx) => {
            const actionCfg = ACTION_COLORS[entry.data.action || ""] || ACTION_COLORS.wait;
            const isDone = entry.data.action === "done";

            return (
              <div
                key={entry.id}
                className="liquid-glass-card rounded-[24px] overflow-hidden transition-all duration-300 flex flex-col border border-white/60 shadow-lg hover:shadow-2xl"
              >
                {/* Large Visual Area */}
                <div
                  onClick={() => setActiveModalIndex(idx)}
                  className="relative aspect-video w-full bg-black/90 cursor-zoom-in group overflow-hidden border-b border-white/40"
                >
                  {entry.data.screenshotUrl ? (
                    <>
                      <img
                        src={entry.data.screenshotUrl}
                        alt="Redacted visual"
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />

                      {/* Top Overlay Badge */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-white bg-[#0D0D0D]/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 flex items-center gap-1 shadow-md">
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          <span>REDACTED</span>
                        </span>
                        <span className="text-[9px] text-white/75 bg-[#0D0D0D]/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 font-mono capitalize">
                          {entry.data.provider || "VLM"}
                        </span>
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3.5 py-1.5 rounded-full shadow-xl flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5" />
                          <span>Click to Enlarge</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-zinc-600">
                      <Camera className="w-10 h-10 text-zinc-700 mb-2" />
                      <p className="text-xs text-zinc-500 font-medium">Redacted Screen Processing...</p>
                    </div>
                  )}
                </div>

                {/* Card Body with Liquid Glass Sheen */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white/15 backdrop-blur-md border-t border-white/40">
                  <div>
                    {/* Action & PII Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${actionCfg.badge}`}>
                          {entry.data.action || "—"}
                        </span>
                        {(entry.data.detections ?? 0) > 0 ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full liquid-glass-pill text-[#111111] font-semibold border border-red-500/30 flex items-center gap-1 shadow-xs">
                            <ShieldAlert className="w-3 h-3 text-red-500" />
                            <span>{entry.data.detections} PII masked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full liquid-glass-pill text-emerald-600 font-medium">
                            ✓ No PII
                          </span>
                        )}
                      </div>

                      <time className="text-[10px] text-[#777777] font-mono shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </time>
                    </div>

                    {/* Page Title */}
                    {entry.data.pageTitle && (
                      <p className="text-xs text-[#222222] font-semibold truncate mb-1.5 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                        <span>{entry.data.pageTitle}</span>
                      </p>
                    )}

                    {/* Reasoning */}
                    <p className="text-xs text-[#555555] leading-relaxed line-clamp-2">
                      {entry.data.reasoning || "—"}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/40 text-[11px] text-[#777777]">
                    <span className="flex items-center gap-1 font-mono">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>{entry.data.latency ? `${entry.data.latency}ms` : "—"}</span>
                    </span>

                    <button
                      onClick={() => setActiveModalIndex(idx)}
                      className="text-xs text-[#111111] font-semibold flex items-center gap-1 hover:underline"
                    >
                      <span>Inspect Screen</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* HIGH-RES LIGHTBOX MODAL WITH ZOOM & DETAILS                  */}
      {/* ============================================================ */}
      {modalEntry && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
          onClick={() => {
            setActiveModalIndex(null);
            setZoomLevel(1);
          }}
        >
          {/* Modal Topbar */}
          <div
            className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                🔒 ON-DEVICE REDACTED
              </span>
              <h2 className="text-sm font-semibold text-white truncate max-w-md">
                {modalEntry.data.pageTitle || "Screenshot Inspection"}
              </h2>
              <span className="text-xs text-white/40 hidden sm:inline">
                ({activeModalIndex! + 1} of {filteredEntries.length})
              </span>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom In/Out */}
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all"
                title="Zoom Out"
              >
                −
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-all"
                title="Reset Zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all"
                title="Zoom In"
              >
                +
              </button>

              {/* Prev / Next */}
              <button
                disabled={activeModalIndex! <= 0}
                onClick={() => {
                  setActiveModalIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
                  setZoomLevel(1);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center text-xs transition-all"
                title="Previous Screen (Left Arrow)"
              >
                ←
              </button>
              <button
                disabled={activeModalIndex! >= filteredEntries.length - 1}
                onClick={() => {
                  setActiveModalIndex((prev) => (prev !== null && prev < filteredEntries.length - 1 ? prev + 1 : prev));
                  setZoomLevel(1);
                }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white flex items-center justify-center text-xs transition-all"
                title="Next Screen (Right Arrow)"
              >
                →
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  setActiveModalIndex(null);
                  setZoomLevel(1);
                }}
                className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 flex items-center justify-center text-sm font-bold transition-all ml-2"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Main Viewport (Image + Side Panel) */}
          <div
            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Center Image Container */}
            <div className="lg:col-span-8 flex items-center justify-center bg-black/80 rounded-2xl border border-white/8 overflow-auto p-4 relative">
              {modalEntry.data.screenshotUrl ? (
                <img
                  src={modalEntry.data.screenshotUrl}
                  alt="Enlarged screenshot"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transition: "transform 0.15s ease-out",
                  }}
                  className="max-h-full max-w-full object-contain rounded shadow-2xl origin-center"
                />
              ) : (
                <div className="text-zinc-500 text-sm">No screenshot available</div>
              )}
            </div>

            {/* Sidebar Inspector Details */}
            <div className="lg:col-span-4 bg-zinc-900/90 border border-white/10 rounded-2xl p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Execution Step Details</h3>
                <p className="text-[11px] text-white/40">
                  {new Date(modalEntry.timestamp).toLocaleString()}
                </p>
              </div>

              {/* Action Details */}
              <div className="bg-black/50 border border-white/8 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/50">Action Type</span>
                  <span className="font-bold text-indigo-400 uppercase tracking-wider">
                    {modalEntry.data.action}
                  </span>
                </div>

                {modalEntry.data.selector && (
                  <div>
                    <span className="text-white/50 block mb-1">Selector</span>
                    <span className="font-mono text-zinc-300 bg-white/5 p-1.5 rounded block break-all text-[11px]">
                      {modalEntry.data.selector}
                    </span>
                  </div>
                )}

                {modalEntry.data.value && (
                  <div>
                    <span className="text-white/50 block mb-1">Typed Value</span>
                    <span className="font-mono text-emerald-300 bg-white/5 p-1.5 rounded block break-all text-[11px]">
                      {modalEntry.data.value}
                    </span>
                  </div>
                )}
              </div>

              {/* VLM Reasoning */}
              <div>
                <h4 className="font-semibold text-white/60 mb-1">AI Reasoning</h4>
                <p className="text-white/80 leading-relaxed bg-white/2 p-3 rounded-xl border border-white/6">
                  {modalEntry.data.reasoning || "None"}
                </p>
              </div>

              {/* Protected PII List */}
              <div>
                <h4 className="font-semibold text-red-400 mb-1.5 flex items-center gap-1.5">
                  <span>🛡️ Masked PII Items ({modalEntry.data.detectionList?.length || modalEntry.data.detections || 0})</span>
                </h4>
                {modalEntry.data.detectionList && modalEntry.data.detectionList.length > 0 ? (
                  <div className="space-y-1.5">
                    {modalEntry.data.detectionList.map((det, i) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 flex items-center justify-between text-[11px]">
                        <span className="text-red-300 font-medium capitalize">{det.type}</span>
                        <span className="text-red-400/60 font-mono text-[10px]">{det.strategy || "solid_fill"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                    ✓ Zero sensitive data exposed to server or VLM
                  </div>
                )}
              </div>

              {/* Technical specs */}
              <div className="pt-3 border-t border-white/8 space-y-1.5 text-[11px] text-white/40">
                <div className="flex justify-between">
                  <span>Vision Model</span>
                  <span className="text-white/70 capitalize">{modalEntry.data.provider || "Gemini"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Roundtrip Latency</span>
                  <span className="text-white/70 font-mono">{modalEntry.data.latency ? `${modalEntry.data.latency}ms` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Session ID</span>
                  <span className="text-white/70 font-mono truncate max-w-[150px]">{modalEntry.sessionId}</span>
                </div>
              </div>

              {/* Download screenshot */}
              {modalEntry.data.screenshotUrl && (
                <a
                  href={modalEntry.data.screenshotUrl}
                  download={`aavaran-step-${activeModalIndex! + 1}.jpg`}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-center font-medium block transition-all mt-4"
                >
                  Download Redacted Screenshot
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
