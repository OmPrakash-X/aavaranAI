// ============================================================
// NER Detector — BERT Named Entity Recognition via Transformers.js
// Layer 3 of 4 — ~150ms, detects person names, orgs, locations
// ============================================================

export class NERDetector {
  constructor() {
    this.pipeline = null;
    this.isReady = false;
  }

  /**
   * Initialize BERT-NER pipeline via Transformers.js
   */
  async initialize() {
    if (this.isReady) return;

    try {
      // Dynamic import of Transformers.js
      const { pipeline } = await import(chrome.runtime.getURL('lib/transformers.min.js'));

      this.pipeline = await pipeline(
        'token-classification',
        'Xenova/bert-base-NER',
        {
          device: 'webgpu',
          dtype: 'q8',  // Quantized for smaller size
        }
      );

      this.isReady = true;
      console.log('[NER] BERT-NER pipeline initialized');
    } catch (err) {
      console.error('[NER] Failed to initialize:', err);
      // Try CPU fallback
      try {
        const { pipeline } = await import(chrome.runtime.getURL('lib/transformers.min.js'));
        this.pipeline = await pipeline(
          'token-classification',
          'Xenova/bert-base-NER',
          { device: 'cpu' }
        );
        this.isReady = true;
        console.log('[NER] BERT-NER initialized (CPU fallback)');
      } catch (fallbackErr) {
        console.error('[NER] CPU fallback also failed:', fallbackErr);
      }
    }
  }

  /**
   * Run NER on extracted OCR text to find named entities
   * @param {Array} ocrWords - Array of { text, bbox } from OCR detector
   * @returns {Array} Detections with bounding boxes
   */
  async detect(ocrWords) {
    if (!this.isReady || !this.pipeline || !ocrWords?.length) {
      return [];
    }

    try {
      // Combine OCR words into sentences for better NER context
      const sentences = this.groupIntoSentences(ocrWords);
      const detections = [];

      for (const sentence of sentences) {
        const text = sentence.words.map((w) => w.text).join(' ');
        if (text.length < 3) continue;

        // Run BERT-NER
        const entities = await this.pipeline(text, {
          aggregation_strategy: 'simple',
        });

        for (const entity of entities) {
          // Map NER labels to PII types
          const piiType = this.mapEntityType(entity.entity_group);
          if (!piiType) continue;

          // Find the bounding box for this entity in the OCR words
          const bbox = this.findEntityBBox(entity.word, sentence.words);
          if (!bbox) continue;

          detections.push({
            type: piiType,
            bbox,
            confidence: entity.score,
            detectedBy: 'ner',
            rawText: entity.word,
          });
        }
      }

      console.log(`[NER] Found ${detections.length} named entities`);
      return detections;
    } catch (err) {
      console.error('[NER] Detection failed:', err);
      return [];
    }
  }

  /**
   * Map BERT-NER entity labels to PII types
   * BERT-NER outputs: PER, ORG, LOC, MISC
   */
  mapEntityType(entityGroup) {
    const mapping = {
      PER: 'name',           // Person names
      ORG: 'organization',   // Organizations
      LOC: 'location',       // Locations
      MISC: null,            // Skip miscellaneous (too broad)
    };
    return mapping[entityGroup] || null;
  }

  /**
   * Group OCR words into sentence-like chunks (by line proximity)
   */
  groupIntoSentences(ocrWords) {
    if (!ocrWords.length) return [];

    const sentences = [];
    let currentSentence = { words: [ocrWords[0]] };

    for (let i = 1; i < ocrWords.length; i++) {
      const prev = ocrWords[i - 1];
      const curr = ocrWords[i];

      // If on same line (Y coordinates close), add to current sentence
      const sameLineThreshold = 10;
      if (Math.abs(curr.bbox.y - prev.bbox.y) < sameLineThreshold) {
        currentSentence.words.push(curr);
      } else {
        sentences.push(currentSentence);
        currentSentence = { words: [curr] };
      }
    }

    sentences.push(currentSentence);
    return sentences;
  }

  /**
   * Find the bounding box for a named entity within OCR words
   */
  findEntityBBox(entityText, words) {
    const entityLower = entityText.toLowerCase().trim();

    // Try exact word match first
    for (const word of words) {
      if (word.text.toLowerCase().includes(entityLower)) {
        return word.bbox;
      }
    }

    // Try multi-word match: find sequence of words that contain the entity
    const entityTokens = entityLower.split(/\s+/);
    for (let i = 0; i <= words.length - entityTokens.length; i++) {
      const windowText = words
        .slice(i, i + entityTokens.length)
        .map((w) => w.text.toLowerCase())
        .join(' ');

      if (windowText.includes(entityLower)) {
        const firstWord = words[i];
        const lastWord = words[i + entityTokens.length - 1];
        return {
          x: firstWord.bbox.x,
          y: Math.min(firstWord.bbox.y, lastWord.bbox.y),
          width: lastWord.bbox.x + lastWord.bbox.width - firstWord.bbox.x,
          height: Math.max(firstWord.bbox.height, lastWord.bbox.height),
        };
      }
    }

    return null;
  }

  /**
   * Cleanup
   */
  async dispose() {
    this.pipeline = null;
    this.isReady = false;
  }
}
