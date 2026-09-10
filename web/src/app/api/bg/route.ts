import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const publicDest = path.join(process.cwd(), "public", "liquid-glass-bg.png");
  const sourceImage = "C:\\Users\\omnay\\.gemini\\antigravity-ide\\brain\\1ff326d4-65bd-4e7e-970e-bece6e7baf08\\.user_uploaded\\media_1789028175059.png";

  try {
    // 1. If destination already has the image, serve it
    if (fs.existsSync(publicDest)) {
      const buffer = fs.readFileSync(publicDest);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // 2. If source uploaded file exists, copy it to public/ and serve it
    if (fs.existsSync(sourceImage)) {
      const buffer = fs.readFileSync(sourceImage);
      try {
        fs.writeFileSync(publicDest, buffer);
      } catch (writeErr) {
        console.warn("[API/bg] Could not cache to public dir:", writeErr);
      }
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (err) {
    console.error("[API/bg] Error reading background image:", err);
  }

  // Fallback: procedural liquid glass SVG
  const fallbackSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <radialGradient id="grad1" cx="20%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="40%" stop-color="#E8E8E8" />
          <stop offset="100%" stop-color="#D8D8D8" />
        </radialGradient>
        <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="80" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)" />
      <circle cx="400" cy="300" r="350" fill="#FFFFFF" opacity="0.6" filter="url(#blurFilter)" />
      <circle cx="1500" cy="700" r="400" fill="#FFFFFF" opacity="0.5" filter="url(#blurFilter)" />
      <ellipse cx="960" cy="540" rx="600" ry="250" fill="#D0D0D0" opacity="0.3" filter="url(#blurFilter)" />
    </svg>
  `;

  return new NextResponse(fallbackSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
