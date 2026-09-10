// ============================================================
// GET /api/v1/metrics — Aggregated dashboard metrics
// ============================================================

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Session } from '@/lib/db/models';

export async function GET() {
  try {
    await connectDB();

    const [
      totalSessions,
      aggregation,
      recentSessions,
      providerUsage,
      piiBreakdown,
    ] = await Promise.all([
      // Total session count
      Session.countDocuments(),

      // Average metrics
      Session.aggregate([
        {
          $group: {
            _id: null,
            avgLatency: { $avg: '$latency.totalEndToEnd' },
            totalDetections: { $sum: '$totalDetections' },
            avgDetections: { $avg: '$totalDetections' },
          },
        },
      ]),

      // Recent sessions (last 30) — include both Cloudinary URL and base64 fallback, plus detections
      Session.find()
        .sort({ createdAt: -1 })
        .limit(30)
        .select('sessionId pageTitle pageDomain totalDetections detections action latency vlmProvider screenshotUrl +screenshotRedacted createdAt')
        .lean(),

      // Provider usage breakdown
      Session.aggregate([
        { $group: { _id: '$vlmProvider', count: { $sum: 1 } } },
      ]),

      // PII type breakdown
      Session.aggregate([
        { $unwind: '$detections' },
        { $group: { _id: '$detections.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const agg = aggregation[0] || { avgLatency: 0, totalDetections: 0, avgDetections: 0 };

    return NextResponse.json(
      {
        totalSessions,
        totalDetections: agg.totalDetections,
        avgLatency: Math.round(agg.avgLatency || 0),
        avgDetectionsPerSession: Math.round((agg.avgDetections || 0) * 10) / 10,
        piiBreakdown: Object.fromEntries(piiBreakdown.map((p) => [p._id, p.count])),
        providerUsage: Object.fromEntries(providerUsage.map((p) => [p._id, p.count])),
        recentSessions,
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('[API /metrics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to compute metrics' },
      { status: 500 }
    );
  }
}
