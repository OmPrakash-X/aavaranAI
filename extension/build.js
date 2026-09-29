// ============================================================
// Aavaran Extension Build Script — esbuild bundler
// Bundles content script + all local AI detectors into one file
// Run: node build.js
// Watch: node build.js --watch
// ============================================================

import esbuild from 'esbuild';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, cpSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gunzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const outDir = resolve(__dirname, 'dist');

// Ensure dist directory exists
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
if (!existsSync(`${outDir}/ui/popup`)) mkdirSync(`${outDir}/ui/popup`, { recursive: true });
if (!existsSync(`${outDir}/ui/sidepanel`)) mkdirSync(`${outDir}/ui/sidepanel`, { recursive: true });

// ---- Copy static files ----
function copyStatics() {
  // Ensure uncompressed Tesseract traineddata exists alongside .gz
  const gzPath = resolve(__dirname, 'assets/models/tesseract/eng.traineddata.gz');
  const rawPath = resolve(__dirname, 'assets/models/tesseract/eng.traineddata');
  if (existsSync(gzPath) && !existsSync(rawPath)) {
    try {
      const gzBuf = readFileSync(gzPath);
      const rawBuf = gunzipSync(gzBuf);
      writeFileSync(rawPath, rawBuf);
      console.log('[Build] ✅ Uncompressed eng.traineddata.gz -> eng.traineddata');
    } catch (e) {
      console.warn('[Build] Note: could not pre-unzip eng.traineddata:', e.message);
    }
  }

  const manifest = JSON.parse(readFileSync(resolve(__dirname, 'manifest.json'), 'utf-8'));

  // Inside dist/, paths are relative to dist/, so strip "src/"
  if (manifest.content_scripts) {
    manifest.content_scripts = manifest.content_scripts.map(cs => ({
      ...cs,
      js: cs.js.map(f => f.replace(/^src\//, '')),
    }));
  }
  if (manifest.background?.service_worker) {
    manifest.background.service_worker = manifest.background.service_worker.replace(/^src\//, '');
  }
  if (manifest.action?.default_popup) {
    manifest.action.default_popup = manifest.action.default_popup.replace(/^src\//, '');
  }
  if (manifest.side_panel?.default_path) {
    manifest.side_panel.default_path = manifest.side_panel.default_path.replace(/^src\//, '');
  }

  writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 2));

  // Copy HTML files
  try { copyFileSync(resolve(__dirname, 'src/ui/popup/popup.html'), `${outDir}/ui/popup/popup.html`); } catch(e) {}
  try { copyFileSync(resolve(__dirname, 'src/ui/sidepanel/sidepanel.html'), `${outDir}/ui/sidepanel/sidepanel.html`); } catch(e) {}

  // Copy CSS files
  try { copyFileSync(resolve(__dirname, 'src/ui/popup/popup.css'), `${outDir}/ui/popup/popup.css`); } catch(e) {}
  try { copyFileSync(resolve(__dirname, 'src/ui/sidepanel/sidepanel.css'), `${outDir}/ui/sidepanel/sidepanel.css`); } catch(e) {}

  // Process & copy Firefox MV2 manifest
  try {
    const ffManifestRaw = readFileSync(resolve(__dirname, 'manifest_v2.json'), 'utf-8');
    const ffManifest = JSON.parse(ffManifestRaw);
    if (ffManifest.background?.scripts) {
      ffManifest.background.scripts = ffManifest.background.scripts.map(f => f.replace(/^src\//, ''));
    }
    if (ffManifest.content_scripts) {
      ffManifest.content_scripts = ffManifest.content_scripts.map(cs => ({
        ...cs,
        js: cs.js.map(f => f.replace(/^src\//, '')),
      }));
    }
    if (ffManifest.browser_action?.default_popup) {
      ffManifest.browser_action.default_popup = ffManifest.browser_action.default_popup.replace(/^src\//, '');
    }
    if (ffManifest.sidebar_action?.default_panel) {
      ffManifest.sidebar_action.default_panel = ffManifest.sidebar_action.default_panel.replace(/^src\//, '');
    }
    writeFileSync(`${outDir}/manifest_v2.json`, JSON.stringify(ffManifest, null, 2));
  } catch(e) {
    console.warn('[Build] Could not process manifest_v2.json:', e.message);
  }

  // Copy styles/ if present
  const stylesSrc = resolve(__dirname, 'styles');
  if (existsSync(stylesSrc)) {
    cpSync(stylesSrc, `${outDir}/styles`, { recursive: true });
  }

  // Copy assets/ (icons, models)
  const assetsSrc = resolve(__dirname, 'assets');
  if (existsSync(assetsSrc)) {
    cpSync(assetsSrc, `${outDir}/assets`, { recursive: true });
  }

  // Copy lib/ (tesseract, transformers, mediapipe wasm)
  const libSrc = resolve(__dirname, 'lib');
  if (existsSync(libSrc)) {
    cpSync(libSrc, `${outDir}/lib`, { recursive: true });
  }

  // Copy compat/ (Firefox shim)
  const compatSrc = resolve(__dirname, 'src/compat');
  if (existsSync(compatSrc)) {
    if (!existsSync(`${outDir}/compat`)) mkdirSync(`${outDir}/compat`, { recursive: true });
    cpSync(compatSrc, `${outDir}/compat`, { recursive: true });
  }

  console.log('[Build] Static files, assets, models, libs, and Firefox shim copied');
}

// ---- esbuild config ----
const sharedConfig = {
  bundle: true,
  format: 'esm',
  target: 'chrome120',
  minify: false,         // Keep readable for debugging
  sourcemap: false,
  logLevel: 'info',
};

const builds = [
  // 1. Content script — IIFE format (cannot be a module in Chrome MV3)
  {
    entryPoints: [resolve(__dirname, 'src/content/index.js')],
    outfile: `${outDir}/content/index.js`,
    format: 'iife',
    globalName: '__aavaran',
    bundle: true,
    target: 'chrome120',
    external: ['@xenova/transformers', '@mediapipe/tasks-vision', 'tesseract.js'],
    minify: false,
    logLevel: 'info',
  },
  // 2. Background service worker — IIFE format
  {
    ...sharedConfig,
    entryPoints: [resolve(__dirname, 'src/background/index.js')],
    outfile: `${outDir}/background/index.js`,
    format: 'iife',
    bundle: true,
  },
  // 3. Popup script
  {
    ...sharedConfig,
    entryPoints: [resolve(__dirname, 'src/ui/popup/popup.js')],
    outfile: `${outDir}/ui/popup/popup.js`,
    format: 'iife',
    bundle: true,
  },
  // 4. Sidepanel script
  {
    ...sharedConfig,
    entryPoints: [resolve(__dirname, 'src/ui/sidepanel/sidepanel.js')],
    outfile: `${outDir}/ui/sidepanel/sidepanel.js`,
    format: 'iife',
    bundle: true,
  },
];

async function build() {
  copyStatics();

  if (isWatch) {
    // Watch mode — rebuild on changes
    const contexts = await Promise.all(
      builds.map(cfg => esbuild.context(cfg))
    );
    await Promise.all(contexts.map(ctx => ctx.watch()));
    console.log('[Build] Watching for changes... Press Ctrl+C to stop.');
  } else {
    // One-shot build
    await Promise.all(builds.map(cfg => esbuild.build(cfg)));
    console.log('[Build] ✅ Extension built successfully → dist/');
    console.log('[Build] Load the "dist" folder as an unpacked extension in chrome://extensions/');
  }
}

build().catch(err => {
  console.error('[Build] ❌ Build failed:', err);
  process.exit(1);
});
