// Re-export so both the canonical context path (@/contexts/PreferencesContext) and the hooks path
// (@/hooks/usePreferences) resolve to the same hook.
export { usePreferences } from '@/contexts/PreferencesContext';
export type { PreferencesContextValue } from '@/contexts/PreferencesContext';
