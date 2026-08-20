import { useCallback } from 'react';
import { usePreferences } from '@/contexts/PreferencesContext';

export interface UseDarkMode {
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
}

/** Focused dark-mode slice of usePreferences() plus a toggle convenience. */
export function useDarkMode(): UseDarkMode {
  const { darkMode, setDarkMode } = usePreferences();
  const toggleDarkMode = useCallback(() => setDarkMode(!darkMode), [darkMode, setDarkMode]);
  return { darkMode, setDarkMode, toggleDarkMode };
}
