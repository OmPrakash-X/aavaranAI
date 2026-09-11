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
  LogOut,
  ChevronRight,
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
    hasDot: true,
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
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lock outer browser window scroll so only the internal container scrolls smoothly
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
      {/* ─── FULL-WIDTH LIQUID GLASS APP SHELL CONTAINER ─── */}
      <div className="w-full max-w-[1600px] h-full liquid-glass-shell overflow-hidden flex flex-col relative rounded-[28px] border border-white/60 shadow-2xl backdrop-blur-2xl">
        
        {/* ─── TOP WINDOW TITLE BAR ─── */}
        <header className="h-[64px] shrink-0 border-b border-white/40 bg-white/30 backdrop-blur-xl px-6 flex items-center justify-between gap-4 z-20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
          {/* Left: macOS Traffic Lights + Brand Title & Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* macOS 3-dot Window Controls */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/50 border border-white/70 shadow-xs">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Close" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Minimize" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/80 shadow-xs inline-block cursor-pointer hover:scale-110 transition-transform" title="Maximize" />
            </div>

            {/* Brand Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full liquid-glass-pill ml-1">
              <div className="w-6 h-6 rounded-full bg-[#0D0D0D] flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[13px] font-bold text-[#111111] tracking-tight">Aavaran</span>
              <span className="text-[10px] font-medium text-[#777777] hidden sm:inline">Privacy Agent</span>
            </div>

            <ChevronRight className="w-4 h-4 text-[#AAAAAA]" />
            <span className="text-[13px] font-semibold text-[#111111]">
              {NAV_ITEMS.find((i) => i.href === pathname)?.label || "Overview"}
            </span>
          </div>

          {/* Right: Live Clock */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full liquid-glass-pill text-xs font-mono text-[#555555]">
            <span>{currentTime}</span>
          </div>
        </header>

        {/* ─── MAIN SCROLLABLE VIEWPORT ─── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 pb-36 overscroll-contain" data-lenis-prevent>
          <div className="max-w-[1400px] mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* ─── LIGHT FROSTED LIQUID GLASS DOCK (BOTTOM CENTER) ─── */}
        <nav
          aria-label="macOS Liquid Glass Dock"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-2 px-3 rounded-[30px] bg-white/70 border border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.12),inset_0_2px_2px_rgba(255,255,255,0.95)] backdrop-blur-2xl flex items-center gap-2 hover:scale-[1.02] transition-transform duration-300"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`relative group flex items-center justify-center w-12 h-12 rounded-[22px] transition-all duration-300 ${
                  isActive
                    ? "bg-[#0D0D0D] text-white shadow-[0_8px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] scale-110"
                    : "text-[#111111] hover:text-[#000000] hover:bg-white/60 hover:scale-105 active:scale-95"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "text-white" : "text-[#111111]"}`} />

                {/* Live dot */}
                {item.hasDot && !isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                )}

                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#111111]" />
                )}

                {/* Tooltip */}
                <span className="absolute -top-9 px-2.5 py-1 rounded-lg bg-[#0D0D0D] text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="w-px h-6 bg-black/10 mx-1" />

          {/* Exit Action */}
          <Link
            href="/"
            title="Exit to Landing"
            className="group relative flex items-center justify-center w-12 h-12 rounded-[22px] text-[#FF5F56] hover:bg-red-50/60 transition-all hover:scale-105 active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute -top-9 px-2.5 py-1 rounded-lg bg-[#0D0D0D] text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
              Exit
            </span>
          </Link>
        </nav>

      </div>
    </div>
  );
}
