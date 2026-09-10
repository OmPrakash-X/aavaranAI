// ============================================================
// GET /api/v1/health — System health check
// ============================================================

import { NextResponse } from 'next/server';
import { isDBConnected, connectDB } from '@/lib/db/connection';
import type { HealthResponse } from '@/lib/types/api.types';

const startTime = Date.now();

export async function GET() {
  let dbHealthy = isDBConnected();

  // Try connecting if not connected
  if (!dbHealthy) {
    try {
      await connectDB();
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }
  }

  // Check provider availability (via env vars, not actual API calls for speed)
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const mistralConfigured = !!process.env.MISTRAL_API_KEY;

  const status: HealthResponse['status'] =
    dbHealthy && (geminiConfigured || mistralConfigured)
      ? 'ok'
      : dbHealthy || geminiConfigured
        ? 'degraded'
        : 'down';

  const response: HealthResponse = {
    status,
    providers: {
      gemini: geminiConfigured,
      mistral: mistralConfigured,
    },
    database: dbHealthy,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: status === 'down' ? 503 : 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}
