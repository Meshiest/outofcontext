import { describe, it, expect } from 'vitest';
import {
  DRAWING_CANVAS_SIZE,
  DRAWING_MAX_BYTES,
  isValidDrawingBytes,
  parseImageSize,
} from '../shared/drawing';

/**
 * Real header bytes, captured from Chrome's canvas encoder rather than hand-written.
 *
 * The point of using recorded output: Chrome always emits the VP8X ("extended") flavour because it
 * attaches an ICC profile, which is NOT what you would guess from reading the WebP spec - a
 * hand-rolled fixture would have exercised a code path the app never actually sees.
 */
const CHROME_HEADERS = [
  {
    label: 'webp lossy opaque 768',
    width: 768,
    height: 768,
    format: 'webp' as const,
    head: [82, 73, 70, 70, 192, 23, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88, 10, 0, 0, 0, 32, 0, 0, 0, 255, 2, 0, 255, 2, 0, 73, 67],
  },
  {
    label: 'webp lossless alpha 768',
    width: 768,
    height: 768,
    format: 'webp' as const,
    head: [82, 73, 70, 70, 206, 7, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88, 10, 0, 0, 0, 48, 0, 0, 0, 255, 2, 0, 255, 2, 0, 73, 67],
  },
  {
    label: 'webp lossy alpha 512',
    width: 512,
    height: 512,
    format: 'webp' as const,
    head: [82, 73, 70, 70, 28, 7, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88, 10, 0, 0, 0, 48, 0, 0, 0, 255, 1, 0, 255, 1, 0, 73, 67],
  },
  {
    label: 'webp non-square 640x480',
    width: 640,
    height: 480,
    format: 'webp' as const,
    head: [82, 73, 70, 70, 88, 16, 0, 0, 87, 69, 66, 80, 86, 80, 56, 88, 10, 0, 0, 0, 48, 0, 0, 0, 127, 2, 0, 223, 1, 0, 73, 67],
  },
  {
    label: 'png alpha 768 (the Safari fallback path)',
    width: 768,
    height: 768,
    format: 'png' as const,
    head: [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 3, 0, 0, 0, 3, 0, 8, 6, 0, 0, 0, 147, 129, 0],
  },
];

/** Pad a header out to `length` so byte-cap checks see a plausible whole image. */
function image(head: number[], length = 4096): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes.set(head.slice(0, Math.min(head.length, length)), 0);
  return bytes;
}

/** A synthetic simple-lossy (VP8 ) WebP - a flavour Chrome does not emit but other encoders do. */
function vp8Header(width: number, height: number): number[] {
  const b = new Array(32).fill(0);
  [0x52, 0x49, 0x46, 0x46].forEach((v, i) => (b[i] = v));
  [0x57, 0x45, 0x42, 0x50].forEach((v, i) => (b[8 + i] = v));
  [0x56, 0x50, 0x38, 0x20].forEach((v, i) => (b[12 + i] = v)); // "VP8 "
  b[23] = 0x9d;
  b[24] = 0x01;
  b[25] = 0x2a;
  b[26] = width & 0xff;
  b[27] = (width >> 8) & 0x3f;
  b[28] = height & 0xff;
  b[29] = (height >> 8) & 0x3f;
  return b;
}

/** A synthetic simple-lossless (VP8L) WebP. */
function vp8lHeader(width: number, height: number): number[] {
  const b = new Array(32).fill(0);
  [0x52, 0x49, 0x46, 0x46].forEach((v, i) => (b[i] = v));
  [0x57, 0x45, 0x42, 0x50].forEach((v, i) => (b[8 + i] = v));
  [0x56, 0x50, 0x38, 0x4c].forEach((v, i) => (b[12 + i] = v)); // "VP8L"
  b[20] = 0x2f;
  const bits = ((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14);
  b[21] = bits & 0xff;
  b[22] = (bits >>> 8) & 0xff;
  b[23] = (bits >>> 16) & 0xff;
  b[24] = (bits >>> 24) & 0xff;
  return b;
}

describe('parseImageSize', () => {
  for (const c of CHROME_HEADERS) {
    it(`reads ${c.label}`, () => {
      expect(parseImageSize(image(c.head))).toEqual({
        width: c.width,
        height: c.height,
        format: c.format,
      });
    });
  }

  it('reads the simple lossy (VP8 ) flavour other encoders emit', () => {
    expect(parseImageSize(image(vp8Header(768, 768)))).toEqual({
      width: 768,
      height: 768,
      format: 'webp',
    });
  });

  it('reads the simple lossless (VP8L) flavour other encoders emit', () => {
    expect(parseImageSize(image(vp8lHeader(768, 768)))).toEqual({
      width: 768,
      height: 768,
      format: 'webp',
    });
  });

  it('returns null for bytes that are neither PNG nor WebP', () => {
    expect(parseImageSize(image([0, 1, 2, 3, 4, 5, 6, 7]))).toBeNull();
    expect(parseImageSize(new Uint8Array(8))).toBeNull();
  });

  it('returns null for a RIFF container that is not WebP', () => {
    // "RIFF....AVI " - a real container, wrong payload.
    const b = image([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20]);
    expect(parseImageSize(b)).toBeNull();
  });

  it('returns null for a PNG whose first chunk is not IHDR', () => {
    const head = [...CHROME_HEADERS[4].head];
    head[12] = 0x00; // corrupt the chunk type
    expect(parseImageSize(image(head))).toBeNull();
  });

  it('returns null for a WebP with an unknown fourcc', () => {
    const b = image(vp8Header(768, 768));
    b[15] = 0x39; // "VP89"
    expect(parseImageSize(b)).toBeNull();
  });
});

describe('isValidDrawingBytes', () => {
  const at768 = CHROME_HEADERS[1].head;

  it('accepts a WebP at exactly the canvas resolution', () => {
    expect(isValidDrawingBytes(image(at768))).toBe(true);
  });

  it('accepts the PNG a browser without WebP encode support would fall back to', () => {
    expect(isValidDrawingBytes(image(CHROME_HEADERS[4].head))).toBe(true);
  });

  it('rejects any other resolution, including non-square', () => {
    expect(isValidDrawingBytes(image(CHROME_HEADERS[2].head))).toBe(false); // 512
    expect(isValidDrawingBytes(image(CHROME_HEADERS[3].head))).toBe(false); // 640x480
  });

  it('rejects empty bytes and anything over the cap', () => {
    expect(isValidDrawingBytes(new Uint8Array(0))).toBe(false);
    expect(isValidDrawingBytes(image(at768, DRAWING_MAX_BYTES + 1))).toBe(false);
  });

  it('accepts an image sitting exactly on the cap', () => {
    expect(isValidDrawingBytes(image(at768, DRAWING_MAX_BYTES))).toBe(true);
  });

  it('rejects the legacy Paper.js payload, whatever shape it arrives in', () => {
    const legacy = new TextEncoder().encode(JSON.stringify([['Path', { segments: [] }]]));
    expect(isValidDrawingBytes(legacy)).toBe(false);
  });

  it('agrees with DRAWING_CANVAS_SIZE rather than hardcoding it', () => {
    // Guards against the constant being changed without the fixtures being regenerated.
    expect(DRAWING_CANVAS_SIZE).toBe(768);
  });
});
