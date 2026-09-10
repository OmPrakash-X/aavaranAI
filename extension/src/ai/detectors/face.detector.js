// ============================================================
// Face Detector — MediaPipe face detection
// Layer 4 of 4 — ~5ms, detects faces for blur redaction
// ============================================================

export class FaceDetector {
  constructor() {
    this.detector = null;
    this.isReady = false;
  }

  /**
   * Initialize MediaPipe Face Detection
   */
  async initialize() {
    if (this.isReady) return;

    try {
      // Use MediaPipe Vision tasks
      const vision = await import(chrome.runtime.getURL('lib/vision_bundle.mjs'));
      const { FaceDetector: MPFaceDetector } = vision;

      this.detector = await MPFaceDetector.createFromOptions(
        await vision.FilesetResolver.forVisionTasks(
          chrome.runtime.getURL('lib/wasm')
        ),
        {
          baseOptions: {
            modelAssetPath: chrome.runtime.getURL('assets/models/blaze_face_short_range.tflite'),
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          minDetectionConfidence: 0.5,
        }
      );

      this.isReady = true;
      console.log('[FaceDetector] MediaPipe initialized');
    } catch (err) {
      console.error('[FaceDetector] Failed to initialize:', err);
      // Fallback: try without GPU delegate
      try {
        await this.initializeCPU();
      } catch {
        console.error('[FaceDetector] CPU fallback also failed');
      }
    }
  }

  async initializeCPU() {
    const vision = await import(chrome.runtime.getURL('lib/vision_bundle.mjs'));
    const { FaceDetector: MPFaceDetector } = vision;

    this.detector = await MPFaceDetector.createFromOptions(
      await vision.FilesetResolver.forVisionTasks(
        chrome.runtime.getURL('lib/wasm')
      ),
      {
        baseOptions: {
          modelAssetPath: chrome.runtime.getURL('assets/models/blaze_face_short_range.tflite'),
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.5,
      }
    );

    this.isReady = true;
    console.log('[FaceDetector] MediaPipe initialized (CPU fallback)');
  }

  /**
   * Detect faces in an image
   * @param {HTMLImageElement|HTMLCanvasElement} image
   * @returns {Array} Face detections with bounding boxes
   */
  async detect(image) {
    if (!this.isReady || !this.detector) {
      console.warn('[FaceDetector] Not initialized, skipping');
      return [];
    }

    try {
      const result = this.detector.detect(image);
      const detections = [];

      for (const detection of result.detections) {
        const bbox = detection.boundingBox;
        if (!bbox) continue;

        // Add padding around face for better redaction
        const padding = Math.max(bbox.width, bbox.height) * 0.15;

        detections.push({
          type: 'face',
          bbox: {
            x: Math.max(0, Math.round(bbox.originX - padding)),
            y: Math.max(0, Math.round(bbox.originY - padding)),
            width: Math.round(bbox.width + padding * 2),
            height: Math.round(bbox.height + padding * 2),
          },
          confidence: detection.categories?.[0]?.score || 0.9,
          detectedBy: 'mediapipe',
          rawText: null,
        });
      }

      console.log(`[FaceDetector] Found ${detections.length} faces`);
      return detections;
    } catch (err) {
      console.error('[FaceDetector] Detection failed:', err);
      return [];
    }
  }

  /**
   * Cleanup
   */
  async dispose() {
    if (this.detector) {
      this.detector.close();
      this.detector = null;
      this.isReady = false;
    }
  }
}
