import { useTranslation } from 'react-i18next';
import { Select, type SelectOption } from '@/components/ui/Select/Select';
import { LANGUAGES } from '@/i18n/languages';

/**
 * Interface language picker.
 *
 * i18next is the store of record rather than `usePreferences`: it already persists the choice to
 * localStorage (`oocLang`, via the detector's cache) and re-renders every consumer on change, so
 * mirroring it into a second piece of state would only create two things to keep in step.
 *
 * Each option is labelled in its OWN language, not the active one - somebody who has landed in a
 * language they cannot read needs to recognise theirs in the list to get out.
 */
export function LanguageSelector() {
  const { t, i18n } = useTranslation('settings');

  const options: SelectOption[] = LANGUAGES.map((code) => ({
    value: code,
    text: i18n.getFixedT(code, 'common')('language.native'),
  }));

  // A QA run under `?lng=en-XA` resolves to `en` here, which is the honest answer: the pseudo-locale
  // is not one of the offered choices.
  const current = LANGUAGES.find((code) => i18n.resolvedLanguage === code) ?? 'en';

  return (
    <Select
      label={t('language.label')}
      options={options}
      value={current}
      onChange={(value) => void i18n.changeLanguage(value)}
    />
  );
}
