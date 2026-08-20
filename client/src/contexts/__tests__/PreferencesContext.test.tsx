import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  DEFAULT_SOUND_VOLUME,
  PreferencesProvider,
  usePreferences,
} from '@/contexts/PreferencesContext';
import { installLocalStorageMock } from '@/test/localStorageMock';

function wrapper({ children }: { children: ReactNode }) {
  return <PreferencesProvider>{children}</PreferencesProvider>;
}

beforeEach(() => {
  installLocalStorageMock();
  document.documentElement.classList.remove('dark');
});

afterEach(() => {
  document.documentElement.classList.remove('dark');
});

describe('PreferencesContext', () => {
  it('initializes values from localStorage (legacy keys)', () => {
    localStorage.setItem('occDarkMode', 'true');
    localStorage.setItem('oocHideLobby', 'true');
    localStorage.setItem('oocTurnSound', 'chime');
    localStorage.setItem('oocName', 'Ada');

    const { result } = renderHook(() => usePreferences(), { wrapper });
    expect(result.current.darkMode).toBe(true);
    expect(result.current.streamerMode).toBe(true);
    expect(result.current.turnSound).toBe('chime');
    expect(result.current.name).toBe('Ada');
  });

  it('defaults to disabled/empty when localStorage is empty', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    expect(result.current.darkMode).toBe(false);
    expect(result.current.streamerMode).toBe(false);
    expect(result.current.turnSound).toBe('');
    expect(result.current.name).toBe('');
  });

  it('setDarkMode persists occDarkMode and toggles the html.dark class', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });

    act(() => result.current.setDarkMode(true));
    expect(result.current.darkMode).toBe(true);
    expect(localStorage.getItem('occDarkMode')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => result.current.setDarkMode(false));
    expect(result.current.darkMode).toBe(false);
    expect(localStorage.getItem('occDarkMode')).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setStreamerMode persists oocHideLobby', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    act(() => result.current.setStreamerMode(true));
    expect(result.current.streamerMode).toBe(true);
    expect(localStorage.getItem('oocHideLobby')).toBe('true');
  });

  it('setTurnSound persists oocTurnSound', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    act(() => result.current.setTurnSound('retro'));
    expect(result.current.turnSound).toBe('retro');
    expect(localStorage.getItem('oocTurnSound')).toBe('retro');
  });

  it('setName persists oocName', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    act(() => result.current.setName('Grace'));
    expect(result.current.name).toBe('Grace');
    expect(localStorage.getItem('oocName')).toBe('Grace');
  });

  it('setSoundVolume persists oocSoundVolume', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    act(() => result.current.setSoundVolume(0.4));
    expect(result.current.soundVolume).toBe(0.4);
    expect(localStorage.getItem('oocSoundVolume')).toBe('0.4');
  });

  it('clamps the volume it is given to 0..1', () => {
    const { result } = renderHook(() => usePreferences(), { wrapper });
    act(() => result.current.setSoundVolume(4));
    expect(result.current.soundVolume).toBe(1);
    act(() => result.current.setSoundVolume(-2));
    expect(result.current.soundVolume).toBe(0);
  });

  it('defaults the volume when unset, and ignores a corrupt stored value', () => {
    const { result: fresh } = renderHook(() => usePreferences(), { wrapper });
    expect(fresh.current.soundVolume).toBe(DEFAULT_SOUND_VOLUME);

    // A junk value must not silence notifications with no visible cause.
    localStorage.setItem('oocSoundVolume', 'not-a-number');
    const { result: corrupt } = renderHook(() => usePreferences(), { wrapper });
    expect(corrupt.current.soundVolume).toBe(DEFAULT_SOUND_VOLUME);
  });

  it('reads a stored volume, clamping an out-of-range one', () => {
    localStorage.setItem('oocSoundVolume', '0.25');
    const { result } = renderHook(() => usePreferences(), { wrapper });
    expect(result.current.soundVolume).toBe(0.25);

    localStorage.setItem('oocSoundVolume', '9');
    const { result: high } = renderHook(() => usePreferences(), { wrapper });
    expect(high.current.soundVolume).toBe(1);
  });

  it('throws when used outside a PreferencesProvider', () => {
    expect(() => renderHook(() => usePreferences())).toThrow(/PreferencesProvider/);
  });
});
