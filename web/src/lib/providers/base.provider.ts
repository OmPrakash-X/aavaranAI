// ============================================================
// Base VLM Provider — Abstract interface for all providers
// Gemini, Mistral, and Ollama all implement this contract
// ============================================================

export interface VLMAnalysisResult {
  rawResponse: string;
  provider: string;
  latencyMs: number;
}

export abstract class BaseVLMProvider {
  abstract readonly name: string;

  /**
   * Analyze a redacted screenshot with context and return raw VLM response
   */
  abstract analyze(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<VLMAnalysisResult>;

  /**
   * Check if this provider is available and configured
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Get the model name currently being used
   */
  abstract getModelName(): string;
}
