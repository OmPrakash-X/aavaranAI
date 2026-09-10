// ============================================================
// Next.js 16 Proxy — Official convention from Next.js docs
// Handles CORS preflight and headers for Chrome Extension
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '*';

  // Handle preflighted OPTIONS requests
  const isPreflight = request.method === 'OPTIONS';

  if (isPreflight) {
    const preflightHeaders = {
      'Access-Control-Allow-Origin': origin || '*',
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Handle simple requests
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin || '*');

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
