import { vi } from 'vitest';

// Node 25 exposes a global Web Storage `localStorage` that, without a backing file, shadows jsdom's
// with a non-functional plain object (no getItem/setItem/clear). Tests that exercise localStorage
// install this in-memory Storage over the global so the real browser behavior is emulated.

export function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  } as Storage;
}

/** Stub a fresh, empty in-memory localStorage over the global. Returns it for direct assertions. */
export function installLocalStorageMock(): Storage {
  const mock = createLocalStorageMock();
  vi.stubGlobal('localStorage', mock);
  return mock;
}

/**
 * Stub a fresh, empty in-memory sessionStorage over the global. Installing a second one models
 * opening a new tab, since sessionStorage is per-tab.
 */
export function installSessionStorageMock(): Storage {
  const mock = createLocalStorageMock();
  vi.stubGlobal('sessionStorage', mock);
  return mock;
}
