#!/usr/bin/env node
/**
 * Generates public/icons/icon-192x192.png and icon-512x512.png.
 * Pure Node.js — no additional dependencies required.
 * Run: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = resolve(__dirname, '../public/icons')

function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc ^= byte
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (0xedb88320 ^ (crc >>> 1)) : crc >>> 1
    }
  }
  return ((crc ^ 0xffffffff) >>> 0)
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([tb, data])))
  return Buffer.concat([len, tb, data, crcBuf])
}

/**
 * Creates a PNG with a warm dark background (#1a1610) and a pale golden glyph.
 * Draws a simple circle ring with a centre dot — the "Between" mark.
 */
function makePNG(size) {
  const BG = [0x1a, 0x16, 0x10]  // dark warm brown
  const FG = [0xc8, 0xb0, 0x6a]  // golden accent

  const bytesPerRow = size * 3 + 1
  const raw = Buffer.alloc(bytesPerRow * size)

  const cx = size / 2
  const cy = size / 2
  const outerR = size * 0.38
  const ringW  = size * 0.055
  const dotR   = size * 0.09

  for (let y = 0; y < size; y++) {
    raw[y * bytesPerRow] = 0 // PNG filter: None
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const r = Math.sqrt(dx * dx + dy * dy)
      const inRing = r >= outerR - ringW && r <= outerR + ringW * 0.4
      const inDot  = r <= dotR

      const [pr, pg, pb] = inRing || inDot ? FG : BG
      const pos = y * bytesPerRow + 1 + x * 3
      raw[pos]     = pr
      raw[pos + 1] = pg
      raw[pos + 2] = pb
    }
  }

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8]  = 8  // bit depth
  ihdr[9]  = 2  // color type: RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ])
}

mkdirSync(ICONS_DIR, { recursive: true })

for (const size of [192, 512]) {
  const file = resolve(ICONS_DIR, `icon-${size}x${size}.png`)
  writeFileSync(file, makePNG(size))
  console.log(`✓ Created ${file}`)
}
