// ============================================================
// Analyze Service — Core business logic for the analysis pipeline
// Route → Service → Provider → Database
// ============================================================

import { connectDB } from '@/lib/db/connection';
import { Session } from '@/lib/db/models';
import { analyzeWithFallback } from '@/lib/providers';
import { SYSTEM_PROMPT, buildAnalyzePrompt } from '@/lib/constants/prompts';
import { parseAction } from '@/lib/utils/action-parser';
import { uploadToCloudinary } from '@/lib/cloudinary';
import type { AnalyzeRequest, AnalyzeResponse, AgentAction } from '@/lib/types/api.types';

// ---- Per-session action history (in-memory, cleared when session ends) ----
const sessionHistories = new Map<string, Array<{ action: string; selector?: string; value?: string }>>();

/**
 * Strip credential values from VLM reasoning text before storing.
 * The VLM echoes back what it read from the task ("username 'puspa'") —
 * we redact those values so they don't appear on the dashboard.
 */
function sanitizeReasoning(text: string, userTask: string): string {
  let sanitized = text;

  // Extract credential tokens from the task itself and redact them in the reasoning
  // Match patterns like: username is X, password is X, email is X@..., otp is X
  const credPatterns = [
    /(?:username|user|email|login)\s+(?:is|:)\s+['"]?([\w@.+\-]+)['"]?/gi,
    /(?:password|pass|pwd|secret)\s+(?:is|:)\s+['"]?([\S]+)['"]?/gi,
    /(?:otp|pin|code)\s+(?:is|:)\s+['"]?([\d]+)['"]?/gi,
  ];

  for (const pattern of credPatterns) {
    let match;
    while ((match = pattern.exec(userTask)) !== null) {
      const credValue = match[1];
      if (credValue && credValue.length > 1) {
        // Replace every occurrence of the raw value in the reasoning
        sanitized = sanitized.replace(new RegExp(`'${credValue}'`, 'g'), "'[REDACTED]'");
        sanitized = sanitized.replace(new RegExp(`"${credValue}"`, 'g'), '"[REDACTED]"');
        sanitized = sanitized.replace(new RegExp(`\\b${credValue}\\b`, 'g'), '[REDACTED]');
      }
    }
  }

  return sanitized;
}

export async function analyzeScreenshot(
  request: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const startTime = Date.now();

  // Get or create history for this session
  if (!sessionHistories.has(request.sessionId)) {
    sessionHistories.set(request.sessionId, []);
  }
  const actionHistory = sessionHistories.get(request.sessionId)!;

  // 1. Check if task is already complete based on history
  // Only fire when BOTH credentials were typed AND submit was clicked.
  // Do NOT stop just because the task string contains the word 'stop'.
  const alreadyClickedSubmit = actionHistory.some(a =>
    a.action === 'click' && (
      /sign.?in|log.?in|submit|register|sign.?up|Primer/i.test(a.selector || '') ||
      /sign.?in|log.?in|submit/i.test(a.value || '')
    )
  );
  const typedCount = actionHistory.filter(a => a.action === 'type').length;
  // Only stop when agent has typed at least once AND has clicked a submit button
  const formFullySubmitted = alreadyClickedSubmit && typedCount >= 1;

  if (formFullySubmitted) {
    console.log(`[AnalyzeService] Pre-VLM: Typed ${typedCount} field(s) + clicked submit. Task done.`);
    const doneAction: AgentAction = {
      action: 'done',
      selector: '',
      value: '',
      reasoning: 'Form filled and submitted. Stopping agent.',
      nextExpectation: 'Task completed',
    };
    setTimeout(() => sessionHistories.delete(request.sessionId), 10000);
    const totalLatency = Date.now() - startTime;
    logSession(request, doneAction, 'local_guard', 0, totalLatency)
      .catch((err) => console.error('[AnalyzeService] Failed to log session:', err));

    return {
      action: doneAction,
      sessionId: request.sessionId,
      provider: 'local_guard',
      latency: totalLatency,
    };
  }

  // 2. Hard step limit — prevent runaway loops
  const HARD_STEP_LIMIT = 10;
  if (actionHistory.length >= HARD_STEP_LIMIT) {
    console.warn(`[AnalyzeService] Hard step limit (${HARD_STEP_LIMIT}) reached. Forcing done.`);
    const doneAction: AgentAction = {
      action: 'done',
      selector: '',
      value: '',
      reasoning: `Agent completed ${HARD_STEP_LIMIT} steps. Stopping to prevent infinite execution.`,
      nextExpectation: 'Agent stopped',
    };
    setTimeout(() => sessionHistories.delete(request.sessionId), 10000);
    const totalLatency = Date.now() - startTime;
    logSession(request, doneAction, 'local_guard', 0, totalLatency)
      .catch((err) => console.error('[AnalyzeService] Failed to log session:', err));

    return {
      action: doneAction,
      sessionId: request.sessionId,
      provider: 'local_guard',
      latency: totalLatency,
    };
  }

  // 3. Build the prompt with history
  const userPrompt = buildAnalyzePrompt({
    pageTitle: request.pageTitle,
    pageDomain: (request as any).pageDomain || '',
    userTask: request.userTask,
    actionHistory,
    redactionManifest: request.redactionManifest,
    domElements: request.domElements,
  });

  // 4. Send to VLM with automatic fallback
  const vlmResult = await analyzeWithFallback(
    request.screenshot,
    SYSTEM_PROMPT,
    userPrompt,
  );

  // 3. Parse the raw response into a structured action
  let action: AgentAction;
  try {
    action = parseAction(vlmResult.rawResponse);
  } catch (parseErr) {
    console.error('[AnalyzeService] Failed to parse VLM response:', parseErr);
    action = {
      action: 'wait',
      selector: '',
      value: '2000',
      reasoning: `VLM response could not be parsed. Raw: ${vlmResult.rawResponse.slice(0, 100)}`,
      nextExpectation: 'Retrying analysis',
    };
  }


  // 4. Append this action to history (keep last 10 steps)
  actionHistory.push({
    action: action.action,
    selector: action.selector || undefined,
    value: action.value || undefined,
  });
  if (actionHistory.length > 10) actionHistory.shift();

  // Clean up history for completed sessions
  if (action.action === 'done') {
    setTimeout(() => sessionHistories.delete(request.sessionId), 30000);
  }

  const totalLatency = Date.now() - startTime;

  // 5. Log to MongoDB (non-blocking)
  logSession(request, action, vlmResult.provider, vlmResult.latencyMs, totalLatency)
    .catch((err) => console.error('[AnalyzeService] Failed to log session:', err));

  // 6. Return response
  return {
    action,
    sessionId: request.sessionId,
    latency: totalLatency,
    provider: vlmResult.provider,
  };
}


/**
 * Helper to sanitize any raw credential values that may have slipped into action value
 */
function sanitizeValue(value: string | null | undefined, userTask: string): string | null {
  if (!value) return null;
  // If value is a local secret token, keep it as is
  if (value.startsWith('<LOCAL_SECRET_')) return value;

  let sanitized = value;
  const credPatterns = [
    /(?:password|pass|pwd|secret)\s+(?:is|:)\s+['"]?([\S]+)['"]?/gi,
    /(?:otp|pin|code)\s+(?:is|:)\s+['"]?([\d]+)['"]?/gi,
  ];
  for (const pattern of credPatterns) {
    let match;
    while ((match = pattern.exec(userTask)) !== null) {
      const secret = match[1];
      if (secret && secret.length > 1 && sanitized.includes(secret)) {
        sanitized = sanitized.split(secret).join('<LOCAL_SECRET>');
      }
    }
  }
  return sanitized;
}

/**
 * Log the analysis session to MongoDB
 */
async function logSession(
  request: AnalyzeRequest,
  action: AgentAction,
  provider: string,
  serverLatency: number,
  totalLatency: number,
): Promise<void> {
  await connectDB();

  const existingSteps = await Session.countDocuments({ sessionId: request.sessionId });

  // Upload redacted screenshot to Cloudinary using official SDK (best effort)
  let screenshotUrl: string | null = null;
  if (request.screenshot) {
    screenshotUrl = await uploadToCloudinary(
      request.screenshot,
      request.sessionId,
      existingSteps,
    ).catch(() => null);
  }

  // Guaranteed fallback: store thumbnail (or screenshot) directly in MongoDB
  // so the dashboard always has the image immediately, even if Cloudinary fails
  const screenshotFallback = request.thumbnail || request.screenshot;

  await Session.create({
    sessionId: request.sessionId,
    stepIndex: existingSteps,
    pageTitle: request.pageTitle,
    pageDomain: (request as any).pageDomain || '',
    detections: request.redactionManifest.map((r) => ({
      type: r.type,
      bbox: r.bbox,
      confidence: (r as any).confidence ?? 0.9,
      detectedBy: (r as any).detectedBy || 'dom',
      strategy: r.strategy,
    })),
    totalDetections: request.redactionManifest.length,
    redactionCoverage: 100,
    action: {
      action: action.action,
      selector: action.selector,
      value: sanitizeValue(action.value, request.userTask),
      // Sanitize reasoning — strip actual credential values echoed back by the VLM
      reasoning: sanitizeReasoning(action.reasoning, request.userTask),
      nextExpectation: action.nextExpectation,
      confidence: action.confidence,
    },
    latency: {
      clientInference: request.clientLatency ?? request.screenClassification?.latency ?? 0,
      serverRoundTrip: serverLatency,
      totalEndToEnd: totalLatency + (request.clientLatency || 0),
    },
    vlmProvider: provider,
    domElementCount: request.domElements.length,
    ...(screenshotUrl ? { screenshotUrl } : {}),
    screenshotRedacted: screenshotFallback,
    success: true,
  });
}

