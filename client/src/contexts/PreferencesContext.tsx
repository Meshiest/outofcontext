/* eslint-disable react-refresh/only-export-components -- PreferencesProvider + usePreferences are
   colocated here by contract; consumers import the hook from this path. */
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

// localStorage keys - must stay VERBATIM or returning users lose their preferences. Note
// `occDarkMode` uses the `occ` prefix; the rest use `ooc`.
const KEY_DARK_MODE = 'occDarkMode';
const KEY_STREAMER_MODE = 'oocHideLobby';
const KEY_TURN_SOUND = 'oocTurnSound';
const KEY_SOUND_VOLUME = 'oocSoundVolume';
const KEY_NAME = 'oocName';

/** Volume for anyone who has never set one - loud enough to notice, quiet enough not to startle. */
export const DEFAULT_SOUND_VOLUME = 0.7;

/** Shared preferences contract, consumed by the Settings widget. */
export interface PreferencesContextValue {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  streamerMode: boolean;
  setStreamerMode: (value: boolean) => void;
  turnSound: string;
  setTurnSound: (value: string) => void;
  /** Notification playback volume, 0..1. */
  soundVolume: number;
  setSoundVolume: (value: number) => void;
  name: string;
  setName: (value: string) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readBool(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function readString(key: string): string {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

/**
 * Read a 0..1 volume. Anything unparseable or out of range falls back to the default rather than
 * letting a corrupt value silence notifications with no way for the user to tell why.
 */
function readVolume(key: string): number {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return DEFAULT_SOUND_VOLUME;
  }
  if (raw === null) return DEFAULT_SOUND_VOLUME;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_SOUND_VOLUME;
  return Math.min(1, Math.max(0, parsed));
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore write failures (private mode / quota)
  }
}

/** Keep the <html> `dark` class in sync so Tailwind's `dark:` variant tracks the preference. */
function applyDarkClass(enabled: boolean): void {
  document.documentElement.classList.toggle('dark', enabled);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkModeState] = useState(() => readBool(KEY_DARK_MODE));
  const [streamerMode, setStreamerModeState] = useState(() => readBool(KEY_STREAMER_MODE));
  const [turnSound, setTurnSoundState] = useState(() => readString(KEY_TURN_SOUND));
  const [soundVolume, setSoundVolumeState] = useState(() => readVolume(KEY_SOUND_VOLUME));
  const [name, setNameState] = useState(() => readString(KEY_NAME));

  const setDarkMode = useCallback((value: boolean) => {
    setDarkModeState(value);
    writeStorage(KEY_DARK_MODE, String(value));
    applyDarkClass(value);
  }, []);

  const setStreamerMode = useCallback((value: boolean) => {
    setStreamerModeState(value);
    writeStorage(KEY_STREAMER_MODE, String(value));
  }, []);

  const setTurnSound = useCallback((value: string) => {
    setTurnSoundState(value);
    writeStorage(KEY_TURN_SOUND, value);
  }, []);

  const setSoundVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setSoundVolumeState(clamped);
    writeStorage(KEY_SOUND_VOLUME, String(clamped));
  }, []);

  const setName = useCallback((value: string) => {
    setNameState(value);
    writeStorage(KEY_NAME, value);
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      darkMode,
      setDarkMode,
      streamerMode,
      setStreamerMode,
      turnSound,
      setTurnSound,
      soundVolume,
      setSoundVolume,
      name,
      setName,
    }),
    [
      darkMode,
      setDarkMode,
      streamerMode,
      setStreamerMode,
      turnSound,
      setTurnSound,
      soundVolume,
      setSoundVolume,
      name,
      setName,
    ],
  );

  return <PreferencesContext value={value}>{children}</PreferencesContext>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return ctx;
}
