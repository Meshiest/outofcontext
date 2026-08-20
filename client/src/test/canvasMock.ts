/**
 * Installs a no-op 2D canvas context and a `toDataURL` stub so Canvas 2D drawing code can run under
 * jsdom, which implements neither. Import this module for its side effect at the top of any test
 * that mounts a canvas. Only used by tests.
 *
 * The stubs record nothing, so no test can assert on rendered pixels - only that the right calls are
 * reachable and that an export produces a PNG data URL.
 */
type AnyFn = (...args: unknown[]) => unknown;

function makeContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const store: Record<string, unknown> = {};
  const proxy = new Proxy(store, {
    get(target, prop: string) {
      if (prop === 'canvas') return canvas;
      if (prop in target) return target[prop];
      if (prop === 'measureText') return () => ({ width: 0 });
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop() {} });
      }
      if (prop === 'createPattern') return () => ({});
      if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (prop === 'getContextAttributes') return () => ({});
      // Every other access is treated as a no-op drawing method.
      const fn: AnyFn = () => undefined;
      return fn;
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  });
  return proxy as unknown as CanvasRenderingContext2D;
}

let installed = false;

export function installCanvasMock(): void {
  if (installed) return;
  installed = true;
  const proto = HTMLCanvasElement.prototype as unknown as {
    getContext: (id: string) => unknown;
    toDataURL: (type?: string) => string;
    toBlob: (cb: (blob: Blob | null) => void, type?: string) => void;
  };
  const cache = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
  proto.getContext = function (this: HTMLCanvasElement, id: string) {
    if (id !== '2d') return null;
    let ctx = cache.get(this);
    if (!ctx) {
      ctx = makeContext(this);
      cache.set(this, ctx);
    }
    return ctx;
  };
  // jsdom has no rasterizer, so the real toDataURL throws "not implemented". A constant is enough:
  // tests assert the media type and that a payload comes back, never the pixels.
  proto.toDataURL = (type = 'image/png') => `data:${type};base64,iVBORw0KGgo=`;
  // Likewise toBlob, which is how drawings are actually encoded for upload.
  proto.toBlob = function (cb, type = 'image/webp') {
    cb(new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46])], { type }));
  };
}

// Install on import so `import '.../canvasMock'` before `import paper` is sufficient.
installCanvasMock();
