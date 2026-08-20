import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';

export interface StartGameButtonProps {
  /** Disabled when the config is invalid (a `'#numPlayers'` field below its min for the player count). */
  disabled: boolean;
  /** Starts the game. */
  onStart: () => void;
}

/** Admin-only Start Game button, disabled while the current config cannot start. */
export function StartGameButton({ disabled, onStart }: StartGameButtonProps) {
  const { t } = useTranslation('lobby');
  return (
    <div className="my-4 text-center">
      <Button variant="primary" icon="play" disabled={disabled} onClick={onStart}>
        {t('buttons.startGame')}
      </Button>
    </div>
  );
}
