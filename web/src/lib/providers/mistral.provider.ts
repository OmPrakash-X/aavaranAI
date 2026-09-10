// ============================================================
// Mistral Provider — Mistral Pixtral (vision model) as fallback
// ============================================================

import { Mistral } from '@mistralai/mistralai';
import { BaseVLMProvider, VLMAnalysisResult } from './base.provider';

export class MistralProvider extends BaseVLMProvider {
  readonly name = 'mistral';
  private client: Mistral;
  private modelName: string;

  constructor() {
    super();
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('[MistralProvider] MISTRAL_API_KEY not set in environment');
    }
    this.client = new Mistral({ apiKey });
    this.modelName = process.env.MISTRAL_MODEL || 'pixtral-12b-2409';
  }

  async analyze(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<VLMAnalysisResult> {
    const startTime = Date.now();

    // Strip data URL prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageUrl = `data:image/png;base64,${cleanBase64}`;

    const result = await this.client.chat.complete({
      model: this.modelName,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', imageUrl: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0.1,
      maxTokens: 1024,
      responseFormat: { type: 'json_object' },
    });

    const text = result.choices?.[0]?.message?.content || '';
    const responseText = typeof text === 'string' ? text : JSON.stringify(text);
    const latencyMs = Date.now() - startTime;

    console.log(`[Mistral] Response in ${latencyMs}ms (${responseText.length} chars)`);

    return {
      rawResponse: responseText,
      provider: this.name,
      latencyMs,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.chat.complete({
        model: this.modelName,
        messages: [{ role: 'user', content: 'Respond with: OK' }],
        maxTokens: 10,
      });
      return !!result.choices?.[0]?.message?.content;
    } catch (err) {
      console.error('[Mistral] Health check failed:', err);
      return false;
    }
  }

  getModelName(): string {
    return this.modelName;
  }
}
