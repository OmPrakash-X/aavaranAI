// ============================================================
// Ollama Provider — Local LLM, zero API cost, fully private
// Runs vision models like llava, minicpm-v, llava-llama3
// 
// Setup: https://ollama.com → Download → ollama pull llava
// Then set VLM_PRIMARY_PROVIDER=ollama in .env.local
// ============================================================

import { BaseVLMProvider, VLMAnalysisResult } from './base.provider';

export class OllamaProvider extends BaseVLMProvider {
  readonly name = 'ollama';
  private baseUrl: string;
  private model: string;

  constructor() {
    super();
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model   = process.env.OLLAMA_MODEL    || 'llava';
  }

  async analyze(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<VLMAnalysisResult> {
    const startTime = Date.now();

    // Strip data URL prefix — Ollama accepts raw base64
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Use /api/chat (faster, better for structured output than /api/generate)
    const body = {
      model: this.model,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.05,     // Near-deterministic → faster, more consistent JSON
        num_predict: 300,      // Keep output short — we only need one action object
        num_ctx: 4096,         // Context window — enough for DOM + task
        num_gpu: 99,           // Use ALL GPU layers (RTX 3050 full CUDA)
        num_thread: 8,         // Ryzen 6800H has 8 cores — maximize CPU pipeline
        repeat_penalty: 1.1,   // Avoid repetition loops
        top_k: 20,             // Narrow sampling → faster + smarter output
        top_p: 0.9,
      },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: userPrompt,
          images: [cleanBase64],
        },
      ],
    };

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000), // 90s timeout
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `[Ollama] Cannot connect to ${this.baseUrl}. Is Ollama running? ` +
        `Run: ollama serve\nOriginal error: ${msg}`
      );
    }

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`[Ollama] ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json() as { message: { content: string }; done: boolean };
    const latencyMs = Date.now() - startTime;
    const content = data.message?.content || '{}';

    console.log(`[Ollama] ✅ Response in ${latencyMs}ms | model=${this.model} | chars=${content.length}`);

    return {
      rawResponse: content,
      provider: `ollama`,
      latencyMs,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return false;
      const data = await res.json() as { models: Array<{ name: string }> };
      const available = data.models?.map(m => m.name) || [];
      const hasModel  = available.some(n => n.startsWith(this.model));
      if (!hasModel) {
        console.warn(`[Ollama] Model "${this.model}" not found. Available: ${available.join(', ')}`);
        console.warn(`[Ollama] Run: ollama pull ${this.model}`);
      }
      return hasModel;
    } catch {
      return false;
    }
  }

  getModelName(): string {
    return `ollama/${this.model}`;
  }
}
