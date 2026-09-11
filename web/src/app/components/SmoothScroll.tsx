"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // In dashboard views, scrolling is handled by the internal <main> container.
    // Lenis is optimized for the landing and documentation pages.
    if (pathname && pathname.startsWith("/dashboard")) {
      return;
    }

    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}

export function FixedBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
    >
      <img
        src="/liquid-glass-bg.png"
        alt=""
        className="w-full h-full object-cover object-center scale-100"
      />
      {/* Soothing dark tint to eliminate glare and eye strain */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
    </div>
  );
}
