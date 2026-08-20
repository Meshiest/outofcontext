import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';

export interface DoneReadingButtonProps {
  isDone: boolean;
  onClick: () => void;
}

/**
 * The READING-phase toggle. Solid primary "Done Reading" while still reading; flips to a raised
 * neutral "Still Reading" once the player has marked themselves done. Carries its own bottom
 * padding so it never sits flush against the end of the page.
 *
 * `secondary`, not `variant="basic"` - the latter is the GHOST skin, which is flat and
 * transparent, and makes the button read as disabled text rather than a control you can press.
 */
export function DoneReadingButton({ isDone, onClick }: DoneReadingButtonProps) {
  const { t } = useTranslation('game-common');
  return (
    <div className="flex w-full justify-center pb-10">
      <Button
        variant={isDone ? 'secondary' : 'primary'}
        icon={isDone ? 'undo' : 'check'}
        onClick={onClick}
        className="w-full sm:w-auto"
      >
        {isDone ? t('stillReading') : t('doneReading')}
      </Button>
    </div>
  );
}
