// ============================================================
// Generate PNG icons for Aavaran extension (Zero external dependencies)
// Uses Node.js built-in zlib to create valid uncompressed/deflated PNGs
// ============================================================

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetDir = path.resolve(__dirname, '../assets/icons');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Minimal PNG encoder using built-in zlib
function createPng(width, height, getPixel) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // Compression method 0
  ihdrData.writeUInt8(0, 11); // Filter method 0
  ihdrData.writeUInt8(0, 12); // Interlace method 0
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// CRC32 table & calculator
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Shield shape pixel shader
function getShieldPixel(x, y, width, height) {
  // Normalize coordinates (-1 to 1)
  const nx = (x / width) * 2 - 1;
  const ny = (y / height) * 2 - 1;

  // Rounded square / shield contour
  const r = 0.85;
  const inBox = Math.abs(nx) < r && Math.abs(ny) < r;

  // Rounded corners
  const cornerX = Math.max(0, Math.abs(nx) - (r - 0.25));
  const cornerY = Math.max(0, Math.abs(ny) - (r - 0.25));
  const inRounded = Math.sqrt(cornerX * cornerX + cornerY * cornerY) < 0.25;

  if (inBox && inRounded) {
    // Shield inner shape
    const shieldTop = -0.45;
    const shieldBottom = 0.55;
    const shieldWidth = 0.5;

    let inShield = false;
    if (ny >= shieldTop && ny <= 0.1) {
      inShield = Math.abs(nx) <= shieldWidth * (1 - 0.2 * ((ny - shieldTop) / 0.55));
    } else if (ny > 0.1 && ny <= shieldBottom) {
      const t = (ny - 0.1) / (shieldBottom - 0.1);
      inShield = Math.abs(nx) <= shieldWidth * 0.8 * (1 - t * t);
    }

    if (inShield) {
      // Glow white / cyan shield symbol
      return [255, 255, 255, 255];
    }

    // Gradient background: indigo (99, 102, 241) to purple (168, 85, 247)
    const t = (ny + 1) / 2;
    const red = Math.round(99 + (168 - 99) * t);
    const green = Math.round(102 + (85 - 102) * t);
    const blue = Math.round(241 + (247 - 241) * t);
    return [red, green, blue, 255];
  }

  return [0, 0, 0, 0]; // Transparent
}

const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const pngBuf = createPng(size, size, getShieldPixel);
  const outPath = path.join(targetDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, pngBuf);
  console.log(`Generated: ${outPath} (${size}x${size})`);
}

console.log('✅ All Aavaran extension icons generated successfully!');
