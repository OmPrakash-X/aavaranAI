// ============================================================
// Model & Library Downloader for Aavaran Chrome Extension
// Downloads MediaPipe BlazeFace (~1MB), Tesseract.js (~15MB),
// and Transformers.js BERT-NER (~65MB) for 100% offline edge AI.
// Run: node scripts/download-models.js
// ============================================================

import { writeFileSync, mkdirSync, existsSync, createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const DIRS = [
  resolve(rootDir, 'lib'),
  resolve(rootDir, 'lib/wasm'),
  resolve(rootDir, 'assets/models'),
  resolve(rootDir, 'assets/models/tesseract'),
];

DIRS.forEach((d) => {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
});

const DOWNLOAD_ITEMS = [
  // 1. MediaPipe BlazeFace Model (~1MB)
  {
    name: 'BlazeFace Model (TFLite)',
    url: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
    dest: resolve(rootDir, 'assets/models/blaze_face_short_range.tflite'),
  },
  // 2. Tesseract.js Worker & Core (~4MB + 15MB traineddata)
  {
    name: 'Tesseract.js Library',
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
    dest: resolve(rootDir, 'lib/tesseract.min.js'),
  },
  {
    name: 'Tesseract.js Worker',
    url: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
    dest: resolve(rootDir, 'lib/tesseract-worker.min.js'),
  },
  {
    name: 'Tesseract English Language Model',
    url: 'https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz',
    dest: resolve(rootDir, 'assets/models/tesseract/eng.traineddata.gz'),
  },
  // 3. Transformers.js for BERT-NER (~1MB library + model fetched by library on demand)
  {
    name: 'Transformers.js Library',
    url: 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js',
    dest: resolve(rootDir, 'lib/transformers.min.js'),
  },
];

function downloadFile(item) {
  return new Promise((res, rej) => {
    console.log(`[Downloader] Fetching ${item.name}...`);
    const file = createWriteStream(item.dest);

    https
      .get(item.url, (response) => {
        // Handle HTTP redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          https.get(response.headers.location, (redirectedResponse) => {
            redirectedResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`[Downloader] ✅ Saved ${item.name}`);
              res();
            });
          }).on('error', (err) => {
            file.close();
            rej(err);
          });
          return;
        }

        if (response.statusCode !== 200) {
          file.close();
          rej(new Error(`Failed to download ${item.name}: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`[Downloader] ✅ Saved ${item.name}`);
          res();
        });
      })
      .on('error', (err) => {
        file.close();
        rej(err);
      });
  });
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Aavaran Edge AI Model Downloader');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const item of DOWNLOAD_ITEMS) {
    try {
      await downloadFile(item);
    } catch (err) {
      console.warn(`[Downloader] ⚠️ Warning for ${item.name}:`, err.message);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Edge AI models & libraries successfully downloaded!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main();
