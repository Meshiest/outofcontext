import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';
import { Textarea } from '@/components/ui/Textarea/Textarea';

const MAX_LEN = 256;

export interface RecipeLineFormProps {
  /** Label rendered above the textarea. */
  label: string;
  /** Final link of the chain -> positive "Finish"; otherwise primary "Sign". */
  isLastLink: boolean;
  /** Called with the entered text on a valid submit; the field then clears. */
  onSubmit: (line: string) => void;
  /**
   * Blocking validation on top of the 1-256 length rule. Return a message to show (as a red field
   * error) and disable submit, or null to allow. Used by the step editor to require the ITEM keyword.
   */
  validate?: (line: string) => string | null;
  /** Non-blocking warning shown below the field (does NOT disable submit). */
  warn?: (line: string) => ReactNode;
  /** Static helper text shown below the field. */
  helper?: ReactNode;
}

/**
 * The shared textarea + submit used by every Recipe editor. Owns the draft line, enforces the
 * 1-256 length bound plus an optional blocking `validate`, surfaces an optional non-blocking `warn`,
 * and clears on submit. Keeps the theme / step / ingredient / comment editors to just their headers
 * and context.
 */
export function RecipeLineForm({
  label,
  isLastLink,
  onSubmit,
  validate,
  warn,
  helper,
}: RecipeLineFormProps) {
  const { t } = useTranslation('game-recipe');
  const [line, setLine] = useState('');

  const lengthValid = line.length >= 1 && line.length <= MAX_LEN;
  const blockingError = validate ? validate(line) : null;
  const warning = warn ? warn(line) : null;
  const disabled = !lengthValid || blockingError != null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (disabled) return;
    onSubmit(line);
    setLine('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <Textarea
        label={label}
        rows={2}
        maxLength={MAX_LEN}
        value={line}
        onChange={(event) => setLine(event.target.value)}
        error={blockingError ?? undefined}
      />
      {helper != null && <p className="mt-1 text-sm text-text-muted">{helper}</p>}
      {warning != null && <p className="mt-1 text-sm text-warning">{warning}</p>}
      <div className="mt-3 flex justify-center">
        <Button
          type="submit"
          variant={isLastLink ? 'positive' : 'primary'}
          disabled={disabled}
          className="w-full sm:w-auto"
        >
          {isLastLink ? t('finish') : t('sign')}
        </Button>
      </div>
    </form>
  );
}
