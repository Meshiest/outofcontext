import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';
import { usePreferences } from '@/contexts/PreferencesContext';

/** Dark-mode preference toggle. */
export function DarkModeToggle() {
  const { t } = useTranslation('settings');
  const { darkMode, setDarkMode } = usePreferences();
  return (
    <div className="flex flex-col gap-1.5">
      <span className="field-label">{t('darkMode.label')}</span>
      <Checkbox
        label={t('darkMode.toggle')}
        checked={darkMode}
        onChange={(e) => setDarkMode(e.target.checked)}
      />
    </div>
  );
}
