// ============================================================
// Provider Factory — Creates the right VLM provider based on config
// Handles automatic fallback: Gemini → Mistral
// ============================================================

import { BaseVLMProvider } from './base.provider';
import { GeminiProvider } from './gemini.provider';
import { MistralProvider } from './mistral.provider';
import { OllamaProvider } from './ollama.provider';

export type ProviderType = 'gemini' | 'mistral' | 'ollama';

/**
 * Create a specific VLM provider by type
 */
export function createProvider(type: ProviderType): BaseVLMProvider {
  switch (type) {
    case 'gemini':
      return new GeminiProvider();
    case 'mistral':
      return new MistralProvider();
    case 'ollama':
      return new OllamaProvider();  // Local model — no API key needed
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

/**
 * Get the primary provider (from env config or default to Gemini)
 */
export function getPrimaryProvider(): BaseVLMProvider {
  const primary = (process.env.VLM_PRIMARY_PROVIDER || 'gemini') as ProviderType;
  return createProvider(primary);
}

/**
 * Get the fallback provider (from env config or default to Mistral)
 */
export function getFallbackProvider(): BaseVLMProvider | null {
  const fallback = process.env.VLM_FALLBACK_PROVIDER as ProviderType | undefined;
  if (!fallback) {
    // Default fallback logic: if primary is gemini, fallback to mistral, and vice versa
    const primary = process.env.VLM_PRIMARY_PROVIDER || 'gemini';
    try {
      return createProvider(primary === 'gemini' ? 'mistral' : 'gemini');
    } catch {
      return null; // Fallback not configured
    }
  }
  try {
    return createProvider(fallback);
  } catch {
    return null;
  }
}

/**
 * Analyze with automatic fallback
 * Tries primary provider first, falls back to secondary on failure
 */
export async function analyzeWithFallback(
  imageBase64: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ rawResponse: string; provider: string; latencyMs: number }> {
  const primary = getPrimaryProvider();

  try {
    return await primary.analyze(imageBase64, systemPrompt, userPrompt);
  } catch (primaryErr) {
    console.warn(`[ProviderFactory] Primary (${primary.name}) failed:`, primaryErr);

    const fallback = getFallbackProvider();
    if (!fallback) {
      throw new Error(`Primary provider (${primary.name}) failed and no fallback configured`);
    }

    console.log(`[ProviderFactory] Falling back to ${fallback.name}...`);
    return await fallback.analyze(imageBase64, systemPrompt, userPrompt);
  }
}
