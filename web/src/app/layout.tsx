import type { Metadata } from "next";
import "./globals.css";
import { SmoothScroll, FixedBackground } from "./components/SmoothScroll";

export const metadata: Metadata = {
  title: "Aavaran — Privacy-Preserving Browser Vision Agent",
  description:
    "On-device visual perception agent that detects and redacts PII before sending sanitized context for intelligent browser automation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-transparent text-[#111111] min-h-screen antialiased selection:bg-[#111111] selection:text-white relative">
        <SmoothScroll />
        <FixedBackground />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
