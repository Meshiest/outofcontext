import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { useTurnSound } from '@/data/sounds';
import { installLocalStorageMock } from '@/test/localStorageMock';

/**
 * Models the parts of HTMLAudioElement the hook uses. `instances` counts constructed (cached)
 * elements; `clones` counts the detached copies actually played, so the two can be asserted apart.
 */
class MockAudio {
  static instances: MockAudio[] = [];
  static clones: MockAudio[] = [];
  src = '';
  preload = '';
  currentTime = 0;
  playCalls = 0;
  loadCalls = 0;

  constructor(src: string) {
    this.src = src;
    MockAudio.instances.push(this);
  }

  load(): void {
    this.loadCalls += 1;
  }

  cloneNode(): MockAudio {
    const clone = Object.create(MockAudio.prototype) as MockAudio;
    clone.src = this.src;
    clone.preload = this.preload;
    clone.currentTime = 0;
    clone.playCalls = 0;
    clone.loadCalls = 0;
    MockAudio.clones.push(clone);
    return clone;
  }

  play(): Promise<void> {
    this.playCalls += 1;
    return Promise.resolve();
  }
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(PreferencesProvider, null, children);
}

beforeEach(() => {
  installLocalStorageMock();
  MockAudio.instances = [];
  MockAudio.clones = [];
  vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useTurnSound', () => {
  it('does not construct Audio when no sound is selected', () => {
    const { result } = renderHook(() => useTurnSound(), { wrapper });
    result.current();
    expect(MockAudio.instances).toHaveLength(0);
  });

  it('preloads the cached element and plays a detached clone of it', () => {
    const { result } = renderHook(() => useTurnSound(), { wrapper });
    result.current('bit');

    const cached = MockAudio.instances[0];
    expect(MockAudio.instances).toHaveLength(1);
    // Preloaded so playback is not clipped by the element still decoding.
    expect(cached.preload).toBe('auto');
    expect(cached.loadCalls).toBe(1);
    // The cached element is never played itself: rewinding one shared element cut the previous play
    // off whenever two plays overlapped.
    expect(cached.playCalls).toBe(0);
    expect(MockAudio.clones).toHaveLength(1);
    expect(MockAudio.clones[0].playCalls).toBe(1);
  });

  it('caches one element per sound and plays a fresh clone each time', () => {
    const { result } = renderHook(() => useTurnSound(), { wrapper });

    result.current('bit');
    result.current('bit');
    expect(MockAudio.instances).toHaveLength(1);
    expect(MockAudio.clones).toHaveLength(2);

    result.current('chime');
    expect(MockAudio.instances).toHaveLength(2);
    expect(MockAudio.clones).toHaveLength(3);
  });

  it('plays the current turnSound preference when called with no argument', () => {
    localStorage.setItem('oocTurnSound', 'ding');
    const { result } = renderHook(() => useTurnSound(), { wrapper });
    result.current();
    expect(MockAudio.instances).toHaveLength(1);
    expect(MockAudio.clones[0].playCalls).toBe(1);
  });

  it('ignores an unknown sound name', () => {
    const { result } = renderHook(() => useTurnSound(), { wrapper });
    result.current('does-not-exist');
    expect(MockAudio.instances).toHaveLength(0);
  });
});

// The turn sounds are very short (bit is ~105ms), so an HTMLAudioElement's startup latency clips
// them audibly. Where Web Audio exists the hook decodes once and fires a buffer source instead.
class MockBufferSource {
  buffer: unknown = null;
  connected = false;
  connect(): void {
    this.connected = true;
  }
  start(): void {
    MockAudioContext.starts += 1;
  }
}

class MockAudioContext {
  static starts = 0;
  static decodeCalls = 0;
  static gains: number[] = [];
  state = 'running';
  destination = {};
  createBufferSource(): MockBufferSource {
    return new MockBufferSource();
  }
  createGain(): { gain: { value: number }; connect: () => void } {
    const node = {
      gain: {
        set value(v: number) {
          MockAudioContext.gains.push(v);
        },
        get value() {
          return MockAudioContext.gains[MockAudioContext.gains.length - 1] ?? 1;
        },
      },
      connect: () => {},
    };
    return node;
  }
  decodeAudioData(): Promise<unknown> {
    MockAudioContext.decodeCalls += 1;
    return Promise.resolve({});
  }
  resume(): Promise<void> {
    return Promise.resolve();
  }
}

/**
 * `vi.resetModules()` is needed so the module's cached AudioContext and decoded buffers do not leak
 * between tests - which means pulling the provider from the SAME fresh graph, or the hook would look
 * up a different React context than the wrapper provides.
 */
async function loadFreshModule() {
  const [{ useTurnSound: hook }, { PreferencesProvider: Provider }] = await Promise.all([
    import('@/data/sounds'),
    import('@/contexts/PreferencesContext'),
  ]);
  return {
    hook,
    wrapper: ({ children }: { children: ReactNode }) => createElement(Provider, null, children),
  };
}

describe('useTurnSound (Web Audio)', () => {
  beforeEach(() => {
    vi.resetModules();
    installLocalStorageMock();
    MockAudioContext.starts = 0;
    MockAudioContext.decodeCalls = 0;
    MockAudioContext.gains = [];
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) })),
    );
  });

  it('decodes a sound once and fires a buffer source on every play', async () => {
    const { hook, wrapper: freshWrapper } = await loadFreshModule();
    const { result } = renderHook(() => hook(), { wrapper: freshWrapper });

    result.current('bit');
    await waitFor(() => expect(MockAudioContext.starts).toBe(1));

    result.current('bit');
    await waitFor(() => expect(MockAudioContext.starts).toBe(2));
    // Decoded once and reused: re-decoding per play would reintroduce the startup delay.
    expect(MockAudioContext.decodeCalls).toBe(1);
  });

  it('applies the stored volume through a gain node', async () => {
    localStorage.setItem('oocSoundVolume', '0.25');
    const { hook, wrapper: freshWrapper } = await loadFreshModule();
    const { result } = renderHook(() => hook(), { wrapper: freshWrapper });

    result.current('bit');
    await waitFor(() => expect(MockAudioContext.starts).toBe(1));
    expect(MockAudioContext.gains).toContain(0.25);
  });

  it('plays nothing at all when muted', async () => {
    localStorage.setItem('oocSoundVolume', '0');
    const { hook, wrapper: freshWrapper } = await loadFreshModule();
    const { result } = renderHook(() => hook(), { wrapper: freshWrapper });

    result.current('bit');
    // Muted is a real setting, not "very quiet" - nothing should be scheduled.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(MockAudioContext.starts).toBe(0);
  });

  it('skips the gain node at full volume', async () => {
    localStorage.setItem('oocSoundVolume', '1');
    const { hook, wrapper: freshWrapper } = await loadFreshModule();
    const { result } = renderHook(() => hook(), { wrapper: freshWrapper });

    result.current('bit');
    await waitFor(() => expect(MockAudioContext.starts).toBe(1));
    expect(MockAudioContext.gains).toHaveLength(0);
  });

  it('does not construct an HTMLAudioElement when Web Audio is available', async () => {
    const { hook, wrapper: freshWrapper } = await loadFreshModule();
    const { result } = renderHook(() => hook(), { wrapper: freshWrapper });

    result.current('bit');
    await waitFor(() => expect(MockAudioContext.starts).toBe(1));
    expect(MockAudio.instances).toHaveLength(0);
  });
});
