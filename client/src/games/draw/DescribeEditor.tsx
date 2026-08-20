import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';
import { Header } from '@/components/ui/Header/Header';
import { Icon } from '@/components/ui/Icon/Icon';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Card } from '@/components/ui/Card/Card';
import { Doodle } from '@/components/widgets/doodle/Doodle';
import type { DrawingImage } from '@shared/drawing';

export interface DescribeEditorProps {
  /** When the player is describing a drawing, show it read-only above the input. */
  previousImage?: DrawingImage;
  /** True on the very first link (no previous image) -- the "What Should be Drawn?" prompt. */
  isInitial: boolean;
  onSubmit: (description: string) => void;
}

/**
 * Text input for describing what should be drawn. On the initial link it prompts for a fresh idea;
 * otherwise it shows the previous drawing (read-only) and asks the player to describe it. Enforces
 * the same 1-256 character bound as the server.
 */
export function DescribeEditor({ previousImage, isInitial, onSubmit }: DescribeEditorProps) {
  const { t } = useTranslation('game-draw');
  const [line, setLine] = useState('');
  const valid = line.length >= 1 && line.length <= 256;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => setLine(event.target.value);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    onSubmit(line);
    setLine('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isInitial ? (
        <Header as="h4" icon={<Icon name="pencil" />}>
          {t('describe.initialHeader')}
        </Header>
      ) : (
        <div className="flex flex-col gap-3">
          <Header as="h4" icon={<Icon name="pencil" />}>
            {t('describe.describeHeader')}
          </Header>
          {previousImage && (
            <Card className="overflow-hidden">
              <Doodle readOnly image={previousImage} />
            </Card>
          )}
        </div>
      )}
      <Textarea
        label={isInitial ? t('describe.initialLabel') : t('describe.describeLabel')}
        rows={2}
        maxLength={256}
        value={line}
        onChange={handleChange}
      />
      <div className="flex justify-center">
        <Button type="submit" variant="primary" disabled={!valid} className="w-full sm:w-auto">
          {t('describe.submit')}
        </Button>
      </div>
    </form>
  );
}
