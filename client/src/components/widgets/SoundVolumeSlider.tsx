import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/Slider/Slider';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTurnSound } from '@/data/sounds';

/** Slider steps, as whole percent - fine enough to feel continuous, coarse enough to land on round numbers. */
const STEP = 5;

/**
 * Notification volume. Stored 0..1 but presented as a percentage, since a slider labelled "0.7"
 * reads as a developer setting. Releasing the slider plays the current turn sound at the new level,
 * so the choice can be heard rather than guessed at.
 */
export function SoundVolumeSlider() {
  const { t } = useTranslation('settings');
  const { soundVolume, setSoundVolume, turnSound } = usePreferences();
  const play = useTurnSound();

  const percent = Math.round(soundVolume * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="field-label">{t('soundVolume.label')}</span>
        <span className="text-sm tabular-nums text-text-muted">
          {percent === 0 ? t('soundVolume.muted') : `${percent}%`}
        </span>
      </div>
      <Slider
        min={0}
        max={100}
        step={STEP}
        value={percent}
        aria-label={t('soundVolume.label')}
        onChange={(event) => setSoundVolume(Number(event.target.value) / 100)}
        // Preview on release, not on every change: previewing per step would stack a sound per
        // increment while dragging.
        onPointerUp={() => turnSound && play(turnSound)}
        onKeyUp={() => turnSound && play(turnSound)}
      />
    </div>
  );
}
