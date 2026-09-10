// ============================================================
// POST /api/v1/analyze — Main analysis endpoint
// Receives sanitized screenshot + DOM → returns action command
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { analyzeScreenshot } from '@/lib/services/analyze.service';
import type { AnalyzeRequest } from '@/lib/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    // Validate required fields
    if (!body.screenshot) {
      return NextResponse.json(
        { error: 'Missing required field: screenshot' },
        { status: 400 }
      );
    }
    if (!body.userTask) {
      return NextResponse.json(
        { error: 'Missing required field: userTask' },
        { status: 400 }
      );
    }
    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: sessionId' },
        { status: 400 }
      );
    }

    // Run analysis pipeline
    const result = await analyzeScreenshot(body);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[API /analyze] Error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
