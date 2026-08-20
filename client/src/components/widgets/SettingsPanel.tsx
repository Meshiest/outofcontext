import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import { Accordion, AccordionItem } from '@/components/ui/Accordion/Accordion';
import { LanguageSelector } from './LanguageSelector';
import { DarkModeToggle } from './DarkModeToggle';
import { TurnSoundSelector } from './TurnSoundSelector';
import { SoundVolumeSlider } from './SoundVolumeSlider';
import { StreamerModeToggle } from './StreamerModeToggle';

/**
 * Collapsible "User Preferences" panel: language, dark mode, turn sound, volume, and streamer
 * mode. Everything but the language reads and writes through the shared `usePreferences` hook;
 * the language lives in i18next, which persists it itself.
 */
export function SettingsPanel({ className }: { className?: string }) {
  const { t } = useTranslation('settings');
  return (
    <div className={cn('mx-auto mt-3.5 w-full max-w-[290px] pb-7', className)}>
      <Accordion styled>
        <AccordionItem title={t('title')}>
          <div className="flex flex-col gap-4 font-sans text-base">
            <LanguageSelector />
            <DarkModeToggle />
            <TurnSoundSelector />
            <SoundVolumeSlider />
            <StreamerModeToggle />
          </div>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
