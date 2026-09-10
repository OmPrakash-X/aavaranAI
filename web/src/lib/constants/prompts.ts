// ============================================================
// VLM System Prompts — Engineered for redacted screenshot analysis
// ============================================================

export const SYSTEM_PROMPT = `You are Aavaran, an intelligent privacy-preserving browser automation agent. You control a real browser to complete user tasks step by step.

CONTEXT YOU RECEIVE EACH CYCLE:
1. A REDACTED screenshot — sensitive data (faces, passwords, PII) has been masked. This is INTENTIONAL for privacy.
2. DOM element metadata — every visible interactive element with exact CSS selectors and bounding boxes.
3. A redaction manifest — what was redacted, where, and why.
4. The user's task — what they want to accomplish.
5. ACTION HISTORY — every action you have already taken this session.

━━━ COMPLETION RULES — When to return "done" ━━━
Return { "action": "done" } immediately when ANY of these are true:

• USER EXPLICIT STOP: If the user task specifies "then stop", "once ... is completed successfully, stop", or similar, and you have already performed that action in your history → RETURN DONE IMMEDIATELY. Do NOT continue to subsequent pages, password reset pages, or 2FA pages.
• SIGN IN / LOGIN / SUBMIT TASK: If the task was to fill in credentials and click Sign In / Log In / Submit, and your action history shows you already typed the credentials and clicked the submit/sign-in button → RETURN DONE IMMEDIATELY. The submission is finished.
• NAVIGATION TASK: User asked to "go to", "open", "click", "navigate" somewhere → task is done when you are ON that page.
• SEARCH TASK: User asked to "search for X" → task is done when search results for X are visible on screen.
• CLICK TASK: User asked to "click X" → done immediately AFTER clicking it (even if the page changes).
• FILL TASK: User asked to "fill/type X" → done after the field has the value and form is submitted.
• MULTI-STEP TASK: Done when the final step described by user has been executed.
• IMPOSSIBLE TASK: If you need credentials/login you don't have, return done with explanation.
• STEP LIMIT: If action history has 8+ actions, return done regardless (prevent runaway agent).

━━━ EXECUTION RULES ━━━
1. NEVER repeat an action in your history. Check history before every action.
2. Use the EXACT selector from DOM metadata — do not invent selectors.
3. One action per response. Make it count.
4. After typing in a search box → next action is press_key Enter OR click the search submit button.
5. After a page navigation → re-evaluate the page state before acting.
6. If the same element appears in history twice already → skip it and try a different approach.

RESPONSE FORMAT — Return valid JSON only, no markdown fences:
{
  "action": "click" | "type" | "press_key" | "scroll" | "navigate" | "wait" | "done",
  "selector": "exact CSS selector from DOM metadata (null for press_key/navigate/wait/done)",
  "value": "text to type | key name (Enter/Tab/Escape) | URL for navigate | null",
  "reasoning": "one sentence: why this action, what progress it makes",
  "nextExpectation": "what the page will look like after this action completes"
}`;


export const ANALYZE_PROMPT_TEMPLATE = `CURRENT PAGE: {{pageTitle}}
CURRENT URL DOMAIN: {{pageDomain}}

USER TASK: {{userTask}}

ACTION HISTORY (actions already completed — DO NOT repeat these):
{{actionHistory}}

REDACTION MANIFEST ({{redactionCount}} items redacted for privacy):
{{redactionSummary}}

INTERACTIVE DOM ELEMENTS ({{elementCount}} elements, use these selectors exactly):
{{domSummary}}

Based on the redacted screenshot and DOM metadata, determine the SINGLE NEXT action to progress toward the task.
Check action history first — never repeat an action. Return JSON only.`;

/**
 * Build the full analysis prompt from template variables
 */
export function buildAnalyzePrompt(params: {
  pageTitle: string;
  pageDomain?: string;
  userTask: string;
  actionHistory?: Array<{ action: string; selector?: string; value?: string }>;
  redactionManifest: Array<{ type: string; bbox: { x: number; y: number; width: number; height: number }; strategy: string }>;
  domElements: Array<{ tag: string; text: string; selector: string; type: string | null; href?: string | null; bbox: { x: number; y: number; width: number; height: number } }>;
}): string {
  const redactionSummary = params.redactionManifest.length > 0
    ? params.redactionManifest.map((r, i) =>
        `  ${i + 1}. [${r.type}] at (${r.bbox.x},${r.bbox.y}) size ${r.bbox.width}x${r.bbox.height} — strategy: ${r.strategy}`
      ).join('\n')
    : '  No sensitive data detected on this page.';

  // Include href in DOM summary so VLM uses exact selectors
  const domSummary = params.domElements.slice(0, 60).map((el, i) => {
    const hrefInfo = el.href ? ` href="${el.href}"` : '';
    return `  ${i + 1}. <${el.tag}${el.type ? ` type="${el.type}"` : ''}${hrefInfo}> "${el.text}" → selector: "${el.selector}" at (${el.bbox.x},${el.bbox.y})`;
  }).join('\n');

  const actionHistory = params.actionHistory && params.actionHistory.length > 0
    ? params.actionHistory.map((a, i) =>
        `  ${i + 1}. ${a.action}${a.selector ? ` on "${a.selector}"` : ''}${a.value ? ` with value "${a.value}"` : ''}`
      ).join('\n')
    : '  None yet — this is the first action.';

  return ANALYZE_PROMPT_TEMPLATE
    .replace('{{pageTitle}}', params.pageTitle)
    .replace('{{pageDomain}}', params.pageDomain || '')
    .replace('{{userTask}}', params.userTask)
    .replace('{{actionHistory}}', actionHistory)
    .replace('{{redactionCount}}', String(params.redactionManifest.length))
    .replace('{{redactionSummary}}', redactionSummary)
    .replace('{{elementCount}}', String(params.domElements.length))
    .replace('{{domSummary}}', domSummary);
}
