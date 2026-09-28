const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// Tabela de CRC32 padrão para PNG
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, drawFn) {
  // Cada linha de pixels precisa de 1 byte de filtro (0 = None) + width * 4 bytes (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = createChunk("IHDR", ihdr);
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([pngSignature, ihdrChunk, idatChunk, iendChunk]);
}

// Desenha o ícone do Plix: fundo escuro (#0a0f1d), emblema vermelho (#e50914) e símbolo branco
function plixIconDrawer(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const padding = w * 0.12;

  // 1. Fundo dark (#0a0f1d)
  let r = 10, g = 15, b = 29, a = 255;

  // 2. Distância ao centro para quadrado arredondado do emblema
  const bx = Math.abs(x - cx);
  const by = Math.abs(y - cy);
  const boxHalf = cx - padding;
  const cornerRadius = w * 0.22;

  let inBadge = false;
  if (bx <= boxHalf && by <= boxHalf) {
    const rx = Math.max(0, bx - (boxHalf - cornerRadius));
    const ry = Math.max(0, by - (boxHalf - cornerRadius));
    if (rx * rx + ry * ry <= cornerRadius * cornerRadius) {
      inBadge = true;
    }
  }

  if (inBadge) {
    // Gradiente vermelho Plix (#e50914 -> #990000)
    const factor = y / h;
    r = Math.floor(229 - factor * 70);
    g = Math.floor(9 - factor * 5);
    b = Math.floor(20 - factor * 10);

    // 3. Símbolo do Plix: "P" estilizado com corte cinematográfico ou play
    // Triângulo de Play centralizado
    const triLeft = cx - w * 0.12;
    const triRight = cx + w * 0.18;
    const triTop = cy - w * 0.18;
    const triBottom = cy + w * 0.18;

    if (x >= triLeft && x <= triRight) {
      const prog = (x - triLeft) / (triRight - triLeft);
      const curTop = triTop + prog * (cy - triTop);
      const curBottom = triBottom - prog * (triBottom - cy);
      if (y >= curTop && y <= curBottom) {
        // Cor branca do play
        r = 255;
        g = 255;
        b = 255;
      }
    }
  }

  return [r, g, b, a];
}

const iconsDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

console.log("Gerando ícones PWA do Plix...");

// 192x192
const png192 = createPng(192, 192, plixIconDrawer);
fs.writeFileSync(path.join(iconsDir, "icon-192x192.png"), png192);
console.log("✓ icon-192x192.png gerado");

// 512x512
const png512 = createPng(512, 512, plixIconDrawer);
fs.writeFileSync(path.join(iconsDir, "icon-512x512.png"), png512);
fs.writeFileSync(path.join(iconsDir, "icon-maskable-512x512.png"), png512);
fs.writeFileSync(path.join(iconsDir, "apple-touch-icon.png"), png192);
console.log("✓ icon-512x512.png e variantes gerados");

// Ícone SVG vetorial de alta definição
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#991b1b" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="#0a0f1d"/>
  <rect x="64" y="64" width="384" height="384" rx="96" fill="url(#grad)" filter="url(#shadow)"/>
  <path d="M208 160 L352 256 L208 352 Z" fill="#ffffff" filter="url(#shadow)"/>
  <circle cx="216" cy="180" r="16" fill="rgba(255,255,255,0.4)"/>
</svg>`;
fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgContent);
fs.writeFileSync(path.join(__dirname, "..", "public", "favicon.ico"), png192);
console.log("✓ icon.svg e favicon.ico atualizados");
