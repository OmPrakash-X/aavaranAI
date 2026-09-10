"use client";

import { useEffect, useState } from "react";
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
  Cpu
} from "lucide-react";

interface Metrics {
  totalSessions: number;
  totalDetections: number;
  piiBreakdown: Record<string, number>;
}

const DETECTION_TYPES = [
  { key: "face", label: "Face Detection", desc: "Localize and blur human faces with cryptographic irreversible blackout", category: "Biometric", icon: User },
  { key: "password", label: "Passwords & Secrets", desc: "Intercept HTML password inputs and auth token values", category: "Authentication", icon: Lock },
  { key: "email", label: "Email Addresses", desc: "Regex scanner for RFC-compliant email structures", category: "Direct PII", icon: Mail },
  { key: "phone", label: "Phone Numbers", desc: "Indian (+91) and international E.164 phone formats", category: "Direct PII", icon: Phone },
  { key: "aadhaar", label: "Aadhaar Numbers", desc: "Verhoeff-validated 12-digit Indian national identity numbers", category: "Government ID", icon: ShieldAlert },
  { key: "pan", label: "PAN Card Numbers", desc: "Permanent Account Number alphanumeric pattern matching", category: "Government ID", icon: FileText },
  { key: "credit_card", label: "Payment Cards", desc: "Luhn-validated 16-digit Visa/Mastercard/Amex sequences", category: "Financial", icon: CreditCard },
  { key: "name", label: "Person Names", desc: "Named entity recognition for human proper nouns", category: "Identity", icon: User },
  { key: "address", label: "Physical Addresses", desc: "Street addresses, postal codes, and geolocations", category: "Identity", icon: MapPin },
  { key: "dob", label: "Date of Birth", desc: "Calendar birth date string and timestamp extraction", category: "Identity", icon: Calendar },
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-[24px] liquid-glass-card animate-pulse" />
        ))}
      </div>
    );
  }

  const totalDetected = metrics?.totalDetections || 0;

  return (
    <div className="space-y-6">
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
              PII Detection Registry
            </h1>
          </div>
          <p className="text-[13px] text-[#555555] mt-1.5 ml-1 font-medium">
            On-device interception models, scanners, and privacy masking coverage
          </p>
        </div>
      </div>

      {/* ─── SUMMARY CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="liquid-glass-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[13px] font-medium text-[#777777]">Total Intercepted Entities</span>
              <span className="text-[34px] font-bold text-[#111111] tracking-tight block leading-tight">
                {totalDetected}
              </span>
            </div>
          </div>
          <span className="text-[12px] font-medium px-3.5 py-1.5 rounded-full liquid-glass-pill-dark">
            100% Client-Side
          </span>
        </div>

        <div className="liquid-glass-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-[#111111] border border-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <span className="text-[13px] font-medium text-[#777777]">Sanitization Coverage</span>
              <span className="text-[34px] font-bold text-[#111111] tracking-tight block leading-tight">
                100%
              </span>
            </div>
          </div>
          <span className="text-[12px] font-medium px-3.5 py-1.5 rounded-full liquid-glass-pill text-[#444444]">
            Zero Cloud Leakage
          </span>
        </div>
      </div>

      {/* ─── DETECTION CAPABILITIES MATRIX ──────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-[#111111]">Active Detection Scanners</h3>
          <span className="text-[12px] font-mono text-[#777777]">10 Detectors Armed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DETECTION_TYPES.map((det) => {
            const count = metrics?.piiBreakdown?.[det.key] || 0;
            const isActive = count > 0;
            const Icon = det.icon;
            return (
              <div
                key={det.key}
                className="liquid-glass-card p-5 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-2xl bg-white/90 border border-white/90 text-[#111111] flex items-center justify-center shrink-0 shadow-xs">
                      <Icon className="w-4 h-4 text-[#333333]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-[#111111]">{det.label}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full liquid-glass-pill text-[#555555]">
                          {det.category}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#666666] mt-1 leading-relaxed">{det.desc}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[20px] font-bold font-mono ${isActive ? "text-[#111111]" : "text-[#AAAAAA]"}`}>
                      {count}
                    </span>
                    <span className="text-[10px] uppercase block font-mono text-[#888888]">logged</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/60 flex items-center justify-between text-[11px] text-[#777777]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Status: Operational</span>
                  </span>
                  <span className="font-mono text-[#111111] px-2 py-0.5 rounded-full bg-white/60 border border-white/80">
                    Action: Blackout Canvas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
