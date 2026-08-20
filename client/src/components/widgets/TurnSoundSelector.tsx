import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';
import { Select, type SelectOption } from '@/components/ui/Select/Select';
import { usePreferences } from '@/contexts/PreferencesContext';
import { TURN_SOUNDS, useTurnSound } from '@/data/sounds';

/**
 * Turn-notification sound picker with a play-preview button. The set of sounds comes from
 * `TURN_SOUNDS`; the option labels are localized here. Persists via `usePreferences`
 * (localStorage oocTurnSound).
 */
export function TurnSoundSelector() {
  const { t } = useTranslation('settings');
  const { turnSound, setTurnSound } = usePreferences();
  const play = useTurnSound();
  // The control sits beside a preview button, so the label cannot be Select's own (that would put it
  // inside the row). Associated by id instead, so the combobox still has an accessible name.
  const selectId = useId();

  const label = (value: string): string => {
    switch (value) {
      case '':
        return t('turnSound.none');
      case 'bit':
        return t('turnSound.options.bit');
      case 'chime':
        return t('turnSound.options.chime');
      case 'chord':
        return t('turnSound.options.chord');
      case 'ding':
        return t('turnSound.options.ding');
      case 'retro':
        return t('turnSound.options.retro');
      default:
        return value;
    }
  };

  // TURN_SOUNDS omits the "no sound" choice by contract; Settings prepends it.
  const options: SelectOption[] = [
    { value: '', text: t('turnSound.none') },
    ...TURN_SOUNDS.map((sound) => ({
      value: sound.value,
      text: label(sound.value) || sound.label,
    })),
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="field-label">
        {t('turnSound.label')}
      </label>
      <div className="flex items-start gap-2">
        <Select
          id={selectId}
          className="flex-1"
          options={options}
          value={turnSound}
          onChange={setTurnSound}
          placeholder={t('turnSound.placeholder')}
        />
        <Button
          iconButton
          variant="secondary"
          icon="play circle"
          aria-label={t('turnSound.preview')}
          disabled={!turnSound}
          onClick={() => play(turnSound)}
        />
      </div>
    </div>
  );
}
