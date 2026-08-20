import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card/Card';
import { Header } from '@/components/ui/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';
import { WordSelector } from './WordSelector';
import { TruncateSelector } from './TruncateSelector';
import { InkBudget } from './InkBudget';
import {
  COST,
  wordify,
  maxCensor,
  maxTruncate,
  type RedactedGamemode,
  type TamperMode,
} from './redactedUtils';

export interface RedactedTamperEditorProps {
  /** The raw written line to tamper with. */
  line: string;
  /** Ink budget for this edit phase. */
  ink: number;
  /** Which tamper modes the lobby's gamemode allows. */
  gamemode: RedactedGamemode;
  onCensor: (wordIndexes: number[]) => void;
  onTruncate: (count: number) => void;
}

/**
 * The tamper phase: pick a mode (censor words in place, or truncate from the end) and select which
 * words to redact. When the gamemode enables only one mode, that mode is auto-selected and the
 * toggle is hidden.
 */
export function RedactedTamperEditor({
  line,
  ink,
  gamemode,
  onCensor,
  onTruncate,
}: RedactedTamperEditorProps) {
  const { t } = useTranslation('game-redacted');

  const censorEnabled = gamemode.censor === 'player';
  const truncateEnabled = gamemode.truncate === 'player';
  const showToggle = censorEnabled && truncateEnabled;

  const [mode, setMode] = useState<TamperMode>(
    censorEnabled && !truncateEnabled ? 'censor' : 'truncate',
  );
  const [censorWords, setCensorWords] = useState<number[]>([]);
  const [truncateCount, setTruncateCount] = useState(0);

  const censorWordified = wordify(line, ink, COST.censor);
  const truncateWordified = wordify(line, ink, COST.truncate);
  const count = censorWordified.count;
  const maxSelectable = maxCensor(count, ink);
  const maxTruncatable = maxTruncate(count, ink);

  const toggleCensor = (index: number) => {
    setCensorWords((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= maxSelectable) return prev;
      return [...prev, index];
    });
  };

  const selectTruncate = (c: number) => {
    setTruncateCount((prev) => (prev === c ? 0 : c));
  };

  const submit = () => {
    if (mode === 'censor') {
      if (censorWords.length < 1) return;
      onCensor(censorWords);
    } else {
      if (truncateCount < 1) return;
      onTruncate(truncateCount);
    }
  };

  const submitDisabled = mode === 'censor' ? censorWords.length < 1 : truncateCount < 1;

  const budget = (
    <InkBudget
      ink={ink}
      cost={COST}
      used={mode === 'censor' ? censorWords.length : truncateCount}
      mode={mode}
    />
  );

  return (
    <div className="my-4">
      <Header as="h4" icon={<Icon name="eraser" />} className="justify-center text-center">
        {t('tamperHeader')}
      </Header>

      {showToggle && (
        <div className="mt-3 flex justify-center gap-2">
          <Button
            variant={mode === 'truncate' ? 'primary' : 'secondary'}
            aria-pressed={mode === 'truncate'}
            icon="cut"
            onClick={() => setMode('truncate')}
          >
            {t('modeTruncate')}
          </Button>
          <Button
            variant={mode === 'censor' ? 'primary' : 'secondary'}
            aria-pressed={mode === 'censor'}
            icon="eraser"
            onClick={() => setMode('censor')}
          >
            {t('modeCensor')}
          </Button>
        </div>
      )}

      <Card className="mt-3 p-4">
        {mode === 'censor' ? (
          <WordSelector
            words={censorWordified.words}
            selectedIndexes={censorWords}
            maxSelectable={maxSelectable}
            onToggle={toggleCensor}
            trailing={budget}
          />
        ) : (
          <TruncateSelector
            words={truncateWordified.words}
            truncateCount={truncateCount}
            maxTruncatable={maxTruncatable}
            onSelect={selectTruncate}
            trailing={budget}
          />
        )}
      </Card>

      <div className="mt-4 flex justify-center">
        <Button
          variant="primary"
          onClick={submit}
          disabled={submitDisabled}
          className="w-full sm:w-auto"
        >
          {mode === 'censor' ? t('censorStory') : t('truncateStory')}
        </Button>
      </div>
    </div>
  );
}
