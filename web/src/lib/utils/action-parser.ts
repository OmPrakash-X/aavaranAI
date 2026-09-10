// ============================================================
// Action Parser — Parses raw VLM JSON response into typed AgentAction
// ============================================================

import { AgentAction, ActionType } from '@/lib/types/api.types';

const VALID_ACTIONS: ActionType[] = [
  'click', 'type', 'press_key', 'scroll', 'select', 'hover', 'navigate', 'wait', 'done',
];

/**
 * Parse raw VLM response string into a validated AgentAction
 * Handles malformed JSON, missing fields, and invalid values
 */
export function parseAction(rawResponse: string): AgentAction {
  let parsed: Record<string, unknown>;

  try {
    // Try direct parse first
    parsed = JSON.parse(rawResponse);
  } catch {
    // Try extracting JSON from markdown code blocks
    const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch {
        throw new Error(`Failed to parse VLM response as JSON: ${rawResponse.slice(0, 200)}`);
      }
    } else {
      // Try to find any JSON object in the response
      const objectMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          parsed = JSON.parse(objectMatch[0]);
        } catch {
          throw new Error(`Failed to parse VLM response as JSON: ${rawResponse.slice(0, 200)}`);
        }
      } else {
        throw new Error(`No JSON found in VLM response: ${rawResponse.slice(0, 200)}`);
      }
    }
  }

  // Validate action type — gracefully fall back to 'wait' for unknown actions
  const action = String(parsed.action || '').toLowerCase() as ActionType;
  if (!VALID_ACTIONS.includes(action)) {
    console.warn(`[ActionParser] Unknown action "${parsed.action}" from VLM — falling back to wait`);
    return {
      action: 'wait',
      selector: '',
      value: '1000',
      reasoning: `VLM returned unknown action "${parsed.action}". Waiting before retry.`,
      nextExpectation: 'Retrying with corrected action',
    };
  }

  // Build validated action
  const result: AgentAction = {
    action,
    selector: typeof parsed.selector === 'string' ? parsed.selector : '',
    value: parsed.value != null ? String(parsed.value) : null,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : 'No reasoning provided',
    nextExpectation: typeof parsed.nextExpectation === 'string'
      ? parsed.nextExpectation
      : (typeof parsed.next_expectation === 'string' ? parsed.next_expectation : ''),
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : undefined,
  };

  // Validate selector is present for actions that need it
  const selectorRequired = ['click', 'type', 'select', 'hover'];
  if (selectorRequired.includes(action) && !result.selector) {
    console.warn(`[ActionParser] Action "${action}" has no selector — agent may fail to execute`);
  }

  // Validate value is present for actions that need it
  if (action === 'type' && !result.value) {
    console.warn('[ActionParser] "type" action has no value — nothing will be typed');
  }

  return result;
}
