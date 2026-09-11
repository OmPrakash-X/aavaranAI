"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Terminal,
  Filter
} from "lucide-react";

interface Session {
  _id: string;
  sessionId: string;
  stepIndex: number;
  pageTitle: string;
  totalDetections: number;
  action: { action: string; reasoning: string; selector: string };
  latency: { clientInference: number; serverRoundTrip: number; totalEndToEnd: number };
  vlmProvider: string;
  success: boolean;
  createdAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch(`/api/v1/sessions?page=${page}&limit=15`)
      .then(async (res) => {
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      })
      .then((data) => {
        if (data) {
          setSessions(data.sessions || []);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 rounded-[20px] liquid-glass-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── HEADER & CONTROLS WITH MACOS TRAFFIC LIGHTS ─────── */}
      <div className="liquid-glass-card p-5 relative overflow-hidden transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-center shadow-xs shrink-0">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111111]">
              Recorded Agent Sessions
            </h1>
          </div>
          <p className="text-[13px] text-[#555555] mt-1.5 ml-1 font-medium">
            Audit history of visual perceptions, redaction logs, and executed actions
          </p>
        </div>

        {/* Pagination & Filter Pills */}
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#555555] font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-1.5 rounded-full liquid-glass-pill text-[12px] font-medium text-[#111111] hover:bg-white disabled:opacity-30 transition-all shadow-xs flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-1.5 rounded-full liquid-glass-pill text-[12px] font-medium text-[#111111] hover:bg-white disabled:opacity-30 transition-all shadow-xs flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── SESSIONS LIST ──────────────────────────────────── */}
      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="liquid-glass-card p-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-semibold text-[#111111] truncate">
                      {session.pageTitle || "Untitled Browser Session"}
                    </h3>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-medium flex items-center gap-1 ${
                        session.success
                          ? "liquid-glass-pill-dark"
                          : "bg-white/80 text-[#777777] border border-white"
                      }`}
                    >
                      {session.success ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>VERIFIED</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-amber-500" />
                          <span>ABORTED</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#666666] truncate">
                    {session.action?.reasoning || "Direct browser execution"}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Detections Pill */}
                  <div className="text-right">
                    <p className="text-[14px] font-bold text-[#111111] flex items-center justify-end gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{session.totalDetections}</span>
                    </p>
                    <p className="text-[10px] uppercase font-mono text-[#888888]">Redactions</p>
                  </div>

                  {/* Action Badge */}
                  <span className="text-[12px] px-3.5 py-1 rounded-full liquid-glass-pill-dark font-mono font-medium shadow-xs">
                    {session.action?.action || "observe"}
                  </span>

                  {/* Latency */}
                  <div className="text-right">
                    <p className="text-[13px] font-mono font-medium text-[#111111] flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3 text-[#777777]" />
                      <span>{session.latency?.totalEndToEnd || 0}ms</span>
                    </p>
                    <p className="text-[10px] text-[#888888] capitalize">{session.vlmProvider}</p>
                  </div>

                  {/* Timestamp */}
                  <p className="text-[11px] font-mono text-[#888888] w-16 text-right">
                    {new Date(session.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="liquid-glass-card flex flex-col items-center justify-center py-20 text-[#888888]">
          <div className="w-12 h-12 rounded-full bg-white/80 border border-white flex items-center justify-center mb-3 text-[#111111] shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-[15px] font-semibold text-[#111111]">No session logs found</p>
          <p className="text-[13px] text-[#777777] mt-1">
            Tasks launched via the Aavaran Chrome Extension will be audited here
          </p>
        </div>
      )}
    </div>
  );
}
