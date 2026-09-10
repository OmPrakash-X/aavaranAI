"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutGrid,
  Video,
  Clock,
  ShieldCheck,
  Settings,
  Search,
  Bell,
  ArrowLeft,
  Sun,
  Play,
  Activity,
  Zap,
  ChevronRight,
  Shield
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    label: "Live Feed",
    href: "/dashboard/live",
    icon: Video,
  },
  {
    label: "Sessions",
    href: "/dashboard/sessions",
    icon: Clock,
  },
  {
    label: "Detections",
    href: "/dashboard/detections",
    icon: ShieldCheck,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lock body and html scroll so the browser window NEVER scrolls inside the dashboard
  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-transparent p-2 sm:p-4 md:p-6 flex items-center justify-center selection:bg-[#111111] selection:text-white">
      {/* ─── LIQUID GLASS APP SHELL CONTAINER (STRICT FIXED BOUNDS) ── */}
      <div className="w-full max-w-[1540px] h-full liquid-glass-shell overflow-hidden flex flex-row relative">
        {/* ─── FIXED 230px NAVIGATION SIDEBAR (PERMANENT LEFT RAIL) ── */}
        <aside className="w-[230px] h-full shrink-0 bg-white/20 backdrop-blur-xl border-r border-white/35 flex flex-col justify-between p-5 select-none overflow-y-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.7)]">
          <div className="space-y-6">
            {/* macOS Window Controls (Traffic Lights: Red, Yellow, Green) */}
            <div className="flex items-center gap-2 px-1 pt-1 pb-1">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/70 shadow-xs inline-block cursor-pointer hover:opacity-80 transition-opacity" title="Close" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/70 shadow-xs inline-block cursor-pointer hover:opacity-80 transition-opacity" title="Minimize" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/70 shadow-xs inline-block cursor-pointer hover:opacity-80 transition-opacity" title="Maximize" />
              <span className="ml-auto text-[10px] font-mono text-[#888888] uppercase tracking-wider">macOS UI</span>
            </div>

            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3 px-1">
              <div className="w-9 h-9 rounded-2xl bg-[#0D0D0D] flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-[16px] tracking-tight text-[#111111] block leading-tight">Aavaran</span>
                <span className="text-[11px] font-medium text-[#777777]">Vision Agent</span>
              </div>
            </div>

            {/* Navigation Menu (Pill System) */}
            <nav className="space-y-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? "liquid-glass-pill-dark font-semibold shadow-md"
                        : "text-[#666666] hover:text-[#111111] hover:bg-white/40"
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? "text-white" : "text-[#777777]"}`} />
                    <span>{item.label}</span>
                    {item.label === "Live Feed" && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-xs animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Section: Back link & User Profile */}
          <div className="pt-4 border-t border-white/40 space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-full text-[12px] text-[#777777] hover:text-[#111111] hover:bg-white/40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            {/* User Profile Pill */}
            <div className="p-2.5 rounded-2xl liquid-glass-pill flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#111111] to-[#555555] text-white flex items-center justify-center text-xs font-bold ring-2 ring-white">
                AK
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-[#111111] truncate leading-tight">Cascade Admin</div>
                <div className="text-[10px] text-[#777777] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Gemini 2.5 Active</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── MAIN DASHBOARD CONTENT AREA (INDEPENDENT SCROLL) ── */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-transparent">
          {/* ─── TOP NAVIGATION BAR (FIXED AT TOP, 64px) ─────── */}
          <header className="h-[64px] shrink-0 border-b border-white/40 bg-white/20 backdrop-blur-xl px-6 flex items-center justify-between gap-4 z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
            {/* Left: macOS Traffic Lights (3 Colors) + Window Title */}
            <div className="flex items-center gap-3">
              {/* macOS Window Traffic Lights Pill */}
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/40 border border-white/60 shadow-xs">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Close" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Minimize" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Maximize" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-bold text-[#111111] tracking-tight">
                  {NAV_ITEMS.find((i) => i.href === pathname)?.label || "Management"}
                </h2>
                <ChevronRight className="w-4 h-4 text-[#AAAAAA]" />
                <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-black/5 text-[#555555] border border-white/50">
                  macOS Liquid Glass
                </span>
              </div>
            </div>

            {/* Right: Pill Controls & Actions (Matching Reference UI) */}
            <div className="flex items-center gap-3">
              {/* Search Pill */}
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-pill text-[13px] text-[#777777] w-56 focus-within:w-72 transition-all">
                <Search className="w-3.5 h-3.5 text-[#888888] shrink-0" />
                <input
                  type="text"
                  placeholder="Type searching..."
                  className="bg-transparent border-none outline-none text-xs text-[#111111] placeholder:text-[#999999] w-full"
                />
              </div>

              {/* Video call / Live Feed status pill */}
              <Link
                href="/dashboard/live"
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-xs font-medium text-[#222222] hover:bg-white transition-colors"
              >
                <Video className="w-3.5 h-3.5 text-emerald-500" />
                <span>Video Call</span>
              </Link>

              {/* Time & Weather/Status Pill */}
              <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill text-xs font-mono text-[#555555]">
                <Clock className="w-3.5 h-3.5 text-[#888888]" />
                <span>{currentTime ? currentTime.slice(0, 5) : "14:20"}</span>
                <span className="text-[#DDDDDD]">|</span>
                <Sun className="w-3.5 h-3.5 text-[#888888]" />
                <span>23° Sunny</span>
              </div>

              {/* Notification Bell Circle Button */}
              <button
                className="w-9 h-9 rounded-full bg-[#0D0D0D] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xs relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white" />
              </button>

              {/* Action Circle Button (Live Quickplay) */}
              <Link
                href="/dashboard/live"
                className="w-9 h-9 rounded-full liquid-glass-pill text-[#111111] flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xs"
                title="Open Live Vision Feed"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </Link>
            </div>
          </header>

          {/* ─── SCROLLABLE PAGE VIEWPORT (ONLY THIS SCROLLS) ─── */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 overscroll-contain" data-lenis-prevent>
            <div className="max-w-[1360px] mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
