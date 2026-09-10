// ============================================================
// GET /api/v1/sessions — Returns recent sessions WITH screenshots
// Used by the Dashboard Sessions page
// ============================================================

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Session } from '@/lib/db/models';

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const withScreenshots = searchParams.get('screenshots') === 'true';

    const selectFields = 'sessionId stepIndex pageTitle pageDomain totalDetections action latency vlmProvider createdAt success' +
                         (withScreenshots ? ' screenshotRedacted' : '');

    let query = Session.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(selectFields);

    if (withScreenshots) {
      query = (query as any).select('+screenshotRedacted');
    }

    const sessions = await query.lean();

    return NextResponse.json(
      { sessions, total: sessions.length },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('[API /sessions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
