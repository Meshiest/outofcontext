import { DRAWING_MIME, DRAWING_QUALITY } from '@shared/drawing';
import { getMemberId } from '@/trpc/memberId';

/**
 * Uploading and addressing drawing bitmaps.
 *
 * Drawing bytes do not travel through tRPC. They are POSTed once as raw binary and referenced by id
 * afterwards, which keeps them out of the SSE stream (never compressed - see main.ts) and lets the
 * browser cache each image instead of receiving a copy per player.
 */

/** Where a drawing's bytes live. Content-addressed, so this URL is immutable and cached forever. */
export function drawingUrl(id: string): string {
  return `/api/v1/drawing/${encodeURIComponent(id)}`;
}

/** Thrown so callers can show translated copy rather than a raw status code. */
export class DrawingUploadError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`drawing upload failed: ${status}`);
    this.name = 'DrawingUploadError';
    this.status = status;
  }
}

/**
 * Encode a canvas to the wire format.
 *
 * `toBlob` with an unsupported type SILENTLY falls back to PNG rather than failing, so the result
 * can legitimately be either format - the server accepts both. Resolves null only when the browser
 * gives us nothing at all.
 */
export function encodeCanvas(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== 'function') {
      resolve(null);
      return;
    }
    canvas.toBlob((blob) => resolve(blob), DRAWING_MIME, DRAWING_QUALITY);
  });
}

/** Upload drawing bytes, returning the id the game message should carry. */
export async function uploadDrawing(blob: Blob): Promise<string> {
  const response = await fetch('/api/v1/drawing', {
    method: 'POST',
    headers: {
      // Whatever the browser actually produced, so the server sees the true format.
      'Content-Type': blob.type || DRAWING_MIME,
      'x-ooc-member-id': getMemberId(),
    },
    body: blob,
  });
  if (!response.ok) throw new DrawingUploadError(response.status);
  const data = (await response.json()) as { id?: unknown };
  if (typeof data.id !== 'string') throw new DrawingUploadError(response.status);
  return data.id;
}
