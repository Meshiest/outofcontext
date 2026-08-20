import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Divider } from '@/components/ui/Divider/Divider';
import { Button } from '@/components/ui/Button/Button';
import { phoneticTable, toPhonetic } from './phonetic';

export interface LobbyHeaderProps {
  /** The lobby code from the route (lowercase); displayed uppercased. */
  code: string;
}

/**
 * The lobby-code display shown when no game is selected: the code in large type with its spelling
 * alphabet (when the active language has one), plus Copy Code and Share Link buttons. Hidden entirely under streamer
 * mode so a shared screen never leaks the code.
 */
export function LobbyHeader({ code }: LobbyHeaderProps) {
  const { t, i18n } = useTranslation('lobby');
  const { streamerMode } = usePreferences();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (streamerMode) return null;

  const upper = code.toUpperCase();
  const spelled = toPhonetic(code, phoneticTable(i18n));

  const copy = async (text: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard denied (insecure context / no permission): leave the label unchanged.
    }
  };

  return (
    <div>
      <Divider>{t('sections.lobbyCode')}</Divider>
      <div className="mb-4 flex flex-col items-center gap-2">
        <div className="flex justify-center gap-1.5" aria-label={upper}>
          {upper.split('').map((ch, i) => (
            <span key={i} aria-hidden="true" className="keycap h-14 w-11 text-2xl font-bold">
              {ch}
            </span>
          ))}
        </div>
        {/* Only rendered when the active language ships a spelling alphabet - see phonetic.ts
            for why this does not fall back to the English one. */}
        {spelled && <div className="field-label">{spelled}</div>}
      </div>
      <div className="flex flex-nowrap justify-center gap-2">
        {/* Success is signalled by swapping the icon to a check; the label never changes (a shifting
            label resizes the button and reads as a different action). */}
        <Button
          size="sm"
          variant="secondary"
          icon={copied === 'code' ? 'check' : 'copy'}
          onClick={() => copy(upper, 'code')}
        >
          {t('buttons.copyCode')}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={copied === 'link' ? 'check' : 'share'}
          onClick={() => copy(`${window.location.origin}/lobby/${code}`, 'link')}
        >
          {t('buttons.shareLink')}
        </Button>
      </div>
    </div>
  );
}
