/**
 * The drawing image format, shared by the client encoder and the server validator.
 *
 * Every drawing is a transparent square bitmap of exactly DRAWING_CANVAS_SIZE. Fixing the
 * resolution is what makes a drawing device-independent: authoring, transport, and rendering all
 * use the same logical space, so a stroke covers the same fraction of the image on a phone and on
 * a desktop.
 */

/**
 * Logical edge length of every drawing bitmap, in pixels.
 *
 * 768 rather than 1024: measured against realistic drawings, the resolution was never the reason
 * exports were large - PNG was. Switching to WebP cut a typical drawing from 221 KB to ~100 KB at
 * 1024, and 768 takes it to ~70 KB while still matching a desktop canvas's CSS size 1:1.
 */
export const DRAWING_CANVAS_SIZE = 768;

/**
 * What the client asks the canvas to encode.
 *
 * Lossless (quality 1.0), not lossy. For line art that is not the obvious tradeoff it looks like:
 * lossy WebP spends bits describing DCT noise across the flat background, so a simple drawing
 * encodes to 6.1 KB lossy but 2.0 KB lossless. Lossy only wins on dense edge-to-edge scribbles, and
 * it wins there by little enough that exact fidelity is worth more.
 */
export const DRAWING_MIME = 'image/webp';
export const DRAWING_QUALITY = 1.0;

/**
 * Upper bound on the encoded image.
 *
 * Sized from measurement: a pathological full-canvas six-colour scribble encodes to ~111 KB at 768,
 * and a real drawing lands in the single-digit KB. 256 KB is generous headroom. A cap that is too
 * tight surfaces to the player as the Done button silently doing nothing, so err high.
 */
export const DRAWING_MAX_BYTES = 256 * 1024;

/**
 * Stroke widths, in logical canvas units - NOT CSS pixels.
 *
 * Expressing them against DRAWING_CANVAS_SIZE is what makes stroke weight device-independent: a
 * stroke is always the same fraction of the image, so it cannot read heavier on the device that
 * drew it than on the one viewing it. Scaled with the canvas when it moved 1024 -> 768.
 */
export const STROKE_MIN = 6;
export const STROKE_MAX = 48;
export const STROKE_STEPS = 5;

/** A drawing on the wire: the id of an uploaded bitmap, not the bitmap itself. */
export type DrawingImage = string;

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const IHDR = [0x49, 0x48, 0x44, 0x52];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

export interface ImageSize {
  width: number;
  height: number;
  format: 'png' | 'webp';
}

function matches(bytes: Uint8Array, offset: number, signature: number[]): boolean {
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false;
  }
  return true;
}

const u32be = (b: Uint8Array, o: number) =>
  ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
const u24le = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)) >>> 0;
const u16le = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8)) >>> 0;

/**
 * Read the pixel dimensions out of an image header. Null when the bytes are not a format we accept.
 *
 * Both PNG and WebP are handled because `canvas.toBlob(..., 'image/webp')` SILENTLY FALLS BACK to
 * PNG on browsers without WebP encode support. Rejecting PNG would mean those players simply cannot
 * submit a drawing, with no error to explain why.
 */
export function parseImageSize(bytes: Uint8Array): ImageSize | null {
  if (bytes.length < 24) return null;

  if (matches(bytes, 0, PNG_SIGNATURE)) {
    // IHDR is required by the spec to be the first chunk; its type sits at bytes 12-15.
    if (!matches(bytes, 12, IHDR)) return null;
    return { width: u32be(bytes, 16), height: u32be(bytes, 20), format: 'png' };
  }

  if (matches(bytes, 0, RIFF) && matches(bytes, 8, WEBP)) {
    // The fourcc at 12-15 says which of the three WebP flavours this is; each stores its dimensions
    // somewhere different.
    const fourcc = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

    if (fourcc === 'VP8X') {
      // Extended format - what Chrome's canvas encoder always emits, because it attaches an ICC
      // profile. Canvas size is two 24-bit little-endian minus-one values.
      if (bytes.length < 30) return null;
      return { width: u24le(bytes, 24) + 1, height: u24le(bytes, 27) + 1, format: 'webp' };
    }

    if (fourcc === 'VP8 ') {
      // Simple lossy. Frame tag (3 bytes) then the 0x9d012a start code, then 14-bit dimensions.
      if (bytes.length < 30) return null;
      if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
      return {
        width: u16le(bytes, 26) & 0x3fff,
        height: u16le(bytes, 28) & 0x3fff,
        format: 'webp',
      };
    }

    if (fourcc === 'VP8L') {
      // Simple lossless. A 0x2f signature, then 14 bits of width-1 and 14 of height-1, bit-packed.
      if (bytes.length < 25 || bytes[20] !== 0x2f) return null;
      const bits = (bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)) >>> 0;
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
        format: 'webp',
      };
    }
  }

  return null;
}

/**
 * Whether raw image bytes are a drawing this app will accept: a known format, within the byte cap,
 * at exactly the expected square resolution.
 */
export function isValidDrawingBytes(bytes: Uint8Array): boolean {
  if (bytes.length === 0 || bytes.length > DRAWING_MAX_BYTES) return false;
  const size = parseImageSize(bytes);
  return (
    size !== null && size.width === DRAWING_CANVAS_SIZE && size.height === DRAWING_CANVAS_SIZE
  );
}

