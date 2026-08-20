import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';
import { Divider } from '@/components/ui/Divider/Divider';
import { Header } from '@/components/ui/Header/Header';
import { Icon } from '@/components/ui/Icon/Icon';
import { Textarea } from '@/components/ui/Textarea/Textarea';

export interface StoryEditorProps {
  /** Previous context lines (the last `contextLen` links). Empty for the first line of a story. */
  link: string[];
  /** True when this is the final link - the submit becomes a positive "Finish". */
  isLastLink: boolean;
  /** Called with the trimmed line when the player submits a valid entry. */
  onSubmit: (line: string) => void;
}

/**
 * The EDITING interface: shows the prior authors' context (or a "write the first line" prompt),
 * a text area with 1-512 character validation, and a submit that reads "Finish" (positive) on the
 * last link or "Sign" (primary) otherwise. Clears the field after a successful submit.
 */
export function StoryEditor({ link, isLastLink, onSubmit }: StoryEditorProps) {
  const { t } = useTranslation('game-story');
  const [line, setLine] = useState('');

  const trimmed = line.trim();
  const valid = trimmed.length >= 1 && trimmed.length <= 512;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onSubmit(trimmed);
    setLine('');
  };

  return (
    <div className="my-4">
      {link.length === 0 ? (
        <Header as="h4" icon={<Icon name="pencil" />}>
          {t('writeFirstLine')}
        </Header>
      ) : (
        <>
          <Header as="h4" icon={<Icon name="pencil" />}>
            {isLastLink ? t('finishPrefix') + ' ' : ''}
            {t('lastAuthorsWrote', { count: link.length })}
          </Header>
          <div className="mt-2.5">
            {link.map((contextLine, i) => (
              <div key={i}>
                {i !== 0 && <Divider>{t('then')}</Divider>}
                <p className="story-body text-text">{contextLine}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="mt-4">
        <Textarea
          label={t('storyGoes')}
          rows={2}
          maxLength={512}
          value={line}
          onChange={(event) => setLine(event.target.value)}
        />
        <div className="mt-3 flex justify-center">
          <Button
            type="submit"
            variant={isLastLink ? 'positive' : 'primary'}
            disabled={!valid}
            className="w-full sm:w-auto"
          >
            {isLastLink ? t('finish') : t('sign')}
          </Button>
        </div>
      </form>
    </div>
  );
}
