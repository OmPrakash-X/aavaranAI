// ============================================================
// Cloudinary — Upload redacted screenshots using official Node SDK
// ============================================================

import { v2 as cloudinary } from 'cloudinary';

/**
 * Upload a base64 data URI to Cloudinary.
 * Returns the optimized CDN URL, or null if upload fails / not configured.
 */
export async function uploadToCloudinary(
  base64DataUri: string,   // "data:image/jpeg;base64,..."
  sessionId: string,
  stepIndex: number,
): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey    = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret || cloudName === 'your_cloud_name') {
    return null;
  }

  // Configure dynamically to pick up any runtime updates
  cloudinary.config({
    cloud_name: cloudName,
    api_key:    apiKey,
    api_secret: apiSecret,
    secure:     true,
  });

  try {
    const result = await cloudinary.uploader.upload(base64DataUri, {
      folder: `aavaran/sessions/${sessionId}`,
      public_id: `step_${stepIndex}`,
      overwrite: true,
      resource_type: 'image',
      tags: ['aavaran', 'redacted_screenshot'],
      timeout: 8000,
    });

    // Apply URL optimizations (width 800, auto quality, auto format)
    const optimizedUrl = result.secure_url.replace('/upload/', '/upload/w_800,q_auto,f_auto/');
    console.log(`[Cloudinary] ✅ Uploaded [aavaran/sessions/${sessionId}/step_${stepIndex}] → ${optimizedUrl}`);
    return optimizedUrl;
  } catch (err: any) {
    console.error('[Cloudinary] Upload error:', err?.message || err);
    return null;
  }
}
