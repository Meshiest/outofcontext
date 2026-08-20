import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/ui/Header/Header';
import { Button } from '@/components/ui/Button/Button';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Icon } from '@/components/ui/Icon/Icon';
import { RedactedLinePreview } from './RedactedLinePreview';
import { wordCount, type RedactedLineDisplay } from './redactedUtils';

export interface RedactedWriteEditorProps {
  /** Continue-the-story context from the previous round; absent for the first line. */
  context?: RedactedLineDisplay;
  onSubmit: (line: string) => void;
}

/**
 * Write phase: compose a story line. Shows the previous (censored/repaired) line as read-only
 * context when continuing. Requires 1-256 chars and at least one word.
 */
export function RedactedWriteEditor({ context, onSubmit }: RedactedWriteEditorProps) {
  const { t } = useTranslation('game-redacted');
  const [line, setLine] = useState('');

  const words = wordCount(line);
  const valid = line.length >= 1 && line.length <= 256 && words >= 1;

  const submit = () => {
    if (!valid) return;
    onSubmit(line);
    setLine('');
  };

  return (
    <form
      className="my-4 flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Header as="h4" icon={<Icon name="pencil" />}>
        {context ? t('continueStory') : t('writeFirstLine')}
      </Header>

      {context && <RedactedLinePreview line={context.line} />}

      <div>
        <Textarea
          hint={t('wordsHint', { count: words })}
          label={t('storyGoesLabel')}
          value={line}
          rows={2}
          maxLength={256}
          onChange={(e) => setLine(e.target.value)}
        />
      </div>

      <div className="flex justify-center">
        <Button type="submit" variant="primary" disabled={!valid} className="w-full sm:w-auto">
          {t('sign')}
        </Button>
      </div>
    </form>
  );
}
