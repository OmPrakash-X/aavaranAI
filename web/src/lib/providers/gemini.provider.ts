// ============================================================
// Gemini Provider — Google Gemini with Multi-Model Auto-Fallback
// If one model hits quota (429) or limit, it automatically cascades through all available models
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseVLMProvider, VLMAnalysisResult } from './base.provider';

export class GeminiProvider extends BaseVLMProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;
  private modelCascade: string[];
  private activeModelIndex = 0;

  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('[GeminiProvider] GEMINI_API_KEY not set in environment');
    }
    this.client = new GoogleGenerativeAI(apiKey);

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
    const candidateList = [
      primaryModel,
      'gemini-flash-lite-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
    ];

    // Deduplicate while preserving priority order
    this.modelCascade = Array.from(new Set(candidateList));
  }

  async analyze(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<VLMAnalysisResult> {
    let lastError: unknown;

    // Start from activeModelIndex, try each model in the cascade
    for (let i = 0; i < this.modelCascade.length; i++) {
      const modelIdx = (this.activeModelIndex + i) % this.modelCascade.length;
      const modelName = this.modelCascade[modelIdx];

      try {
        const result = await this._doAnalyze(modelName, imageBase64, systemPrompt, userPrompt);
        // Lock in working model for subsequent cycles
        this.activeModelIndex = modelIdx;
        return result;
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isQuotaOrModelError = /429|quota|exceeded|rate|resource_exhausted|not found|404|deprecated|503|500/i.test(msg);

        if (isQuotaOrModelError && i < this.modelCascade.length - 1) {
          const nextModel = this.modelCascade[(modelIdx + 1) % this.modelCascade.length];
          console.warn(`[Gemini] Model "${modelName}" failed (${msg.slice(0, 75)}...). Cascading to next Gemini model: "${nextModel}"`);
          await new Promise(r => setTimeout(r, 600));
          continue;
        }

        // If not a quota/model switchable error, throw to outer provider fallback
        throw err;
      }
    }

    throw lastError;
  }

  private async _doAnalyze(
    modelName: string,
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<VLMAnalysisResult> {
    const startTime = Date.now();

    const model = this.client.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });

    // Detect image format and strip data URL prefix
    const mimeType = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const result = await model.generateContent([
      { text: userPrompt },
      { inlineData: { mimeType, data: cleanBase64 } },
    ]);

    const text = result.response.text();
    const latencyMs = Date.now() - startTime;

    console.log(`[Gemini] ✅ Response in ${latencyMs}ms | model=${modelName} | chars=${text.length}`);

    return { rawResponse: text, provider: 'gemini', latencyMs };
  }

  async healthCheck(): Promise<boolean> {
    for (const modelName of this.modelCascade) {
      try {
        const model = this.client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Respond with: OK');
        if (result.response.text()) return true;
      } catch {
        // try next model
      }
    }
    return false;
  }

  getModelName(): string {
    return this.modelCascade[this.activeModelIndex];
  }
}
