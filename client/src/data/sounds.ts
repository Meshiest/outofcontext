import { useCallback, useEffect, useRef } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';

import bitSound from '@/assets/audio/bit.wav';
import chimeSound from '@/assets/audio/chime.wav';
import chordSound from '@/assets/audio/chord.wav';
import dingSound from '@/assets/audio/ding.wav';
import retroSound from '@/assets/audio/retro.wav';

// Sound name (the value stored in localStorage `oocTurnSound`) -> bundled asset URL.
export const soundMap: Record<string, string> = {
  bit: bitSound,
  chime: chimeSound,
  chord: chordSound,
  ding: dingSound,
  retro: retroSound,
};

/**
 * The 5 turn sounds. `value` is the persisted id / soundMap key; `label` is an i18n KEY (not
 * display text) so all copy stays in locale files - consumers render `t(sound.label)`. An empty
 * `value` means "no sound"; the Settings UI prepends its own "none" option as needed.
 */
export const TURN_SOUNDS: { value: string; label: string }[] = [
  { value: 'bit', label: 'settings:turnSound.options.bit' },
  { value: 'chime', label: 'settings:turnSound.options.chime' },
  { value: 'chord', label: 'settings:turnSound.options.chord' },
  { value: 'ding', label: 'settings:turnSound.options.ding' },
  { value: 'retro', label: 'settings:turnSound.options.retro' },
];

// ---- Web Audio path ------------------------------------------------------------------------
// These sounds are very short - `bit` is ~105ms - and an HTMLAudioElement spends a comparable
// amount of time spinning up its pipeline before the first sample lands, which clips the attack
// audibly. Decoding each asset once into an AudioBuffer and firing a buffer source per play starts
// effectively instantly and never truncates, however often it is retriggered.

let sharedContext: AudioContext | null = null;
const bufferCache = new Map<string, AudioBuffer>();
const decoding = new Map<string, Promise<AudioBuffer | null>>();

type AudioContextCtor = typeof AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  const scope = globalThis as { AudioContext?: AudioContextCtor };
  return typeof scope.AudioContext === 'function' ? scope.AudioContext : null;
}

/** The page's single AudioContext, or null where Web Audio is unavailable (jsdom, old browsers). */
function getContext(): AudioContext | null {
  if (sharedContext) return sharedContext;
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  try {
    sharedContext = new Ctor();
  } catch {
    sharedContext = null;
  }
  return sharedContext;
}

function decode(context: AudioContext, name: string): Promise<AudioBuffer | null> {
  const existing = decoding.get(name);
  if (existing) return existing;
  const promise = fetch(soundMap[name])
    .then((response) => response.arrayBuffer())
    .then((bytes) => context.decodeAudioData(bytes))
    .then((buffer) => {
      bufferCache.set(name, buffer);
      return buffer;
    })
    .catch(() => null);
  decoding.set(name, promise);
  return promise;
}

function playBuffer(context: AudioContext, buffer: AudioBuffer, volume: number): void {
  const source = context.createBufferSource();
  source.buffer = buffer;
  if (volume >= 1 || typeof context.createGain !== 'function') {
    source.connect(context.destination);
  } else {
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.destination);
  }
  source.start();
}

// ---- HTMLAudioElement fallback -------------------------------------------------------------

function fallbackElement(cache: Map<string, HTMLAudioElement>, name: string): HTMLAudioElement {
  let audio = cache.get(name);
  if (!audio) {
    audio = new Audio(soundMap[name]);
    audio.preload = 'auto';
    audio.load?.();
    cache.set(name, audio);
  }
  return audio;
}

/**
 * Returns a stable `play(sound?)` function. Called with no argument it plays the current `turnSound`
 * preference; passed a sound name it plays that one (used by the Settings preview button). No-ops
 * when no sound is selected/passed.
 *
 * Prefers Web Audio (see above); falls back to a cached, preloaded HTMLAudioElement, played as a
 * detached clone so retriggering never cuts the previous play off.
 */
export function useTurnSound(): (sound?: string) => void {
  const { turnSound, soundVolume } = usePreferences();
  const fallbackCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Decode the selected sound ahead of the turn it is needed for.
  useEffect(() => {
    if (!turnSound || !soundMap[turnSound]) return;
    const context = getContext();
    if (context) void decode(context, turnSound);
    else fallbackElement(fallbackCache.current, turnSound);
  }, [turnSound]);

  return useCallback(
    (sound?: string) => {
      const name = sound ?? turnSound;
      if (!name || !soundMap[name]) return;
      // Muted is a real setting, not a rounding of "very quiet": skip playback entirely.
      if (soundVolume <= 0) return;

      const context = getContext();
      if (!context) {
        const cached = fallbackElement(fallbackCache.current, name);
        const node = (cached.cloneNode?.(true) as HTMLAudioElement | undefined) ?? cached;
        node.volume = soundVolume;
        void node.play?.();
        return;
      }

      // A context constructed before any user gesture starts suspended under autoplay policy.
      if (context.state === 'suspended') void context.resume?.();

      const buffer = bufferCache.get(name);
      if (buffer) {
        playBuffer(context, buffer, soundVolume);
        return;
      }
      void decode(context, name).then((decoded) => {
        if (decoded) playBuffer(context, decoded, soundVolume);
      });
    },
    [turnSound, soundVolume],
  );
}
