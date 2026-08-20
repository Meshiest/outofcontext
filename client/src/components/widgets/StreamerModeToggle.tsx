import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';
import { usePreferences } from '@/contexts/PreferencesContext';

/** Streamer-mode toggle: hides lobby codes. Persists via `usePreferences` (localStorage oocHideLobby). */
export function StreamerModeToggle() {
  const { t } = useTranslation('settings');
  const { streamerMode, setStreamerMode } = usePreferences();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="field-label">{t('streamerMode.label')}</span>
      <Checkbox
        label={t('streamerMode.toggle')}
        checked={streamerMode}
        onChange={(e) => setStreamerMode(e.target.checked)}
      />
    </div>
  );
}
