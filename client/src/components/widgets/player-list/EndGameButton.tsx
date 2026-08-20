import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import { Button } from '@/components/ui/Button/Button';
import type { LobbyState } from './types';

export interface EndGameButtonProps {
  isAdmin: boolean;
  lobbyState: LobbyState;
  onEndGame?: () => void;
}

/**
 * Admin-only "End game" button, visible only while playing. The first click arms a 1-second
 * confirmation ("Are you sure?"); a second click within that window ends the game. Auto-resets.
 */
export function EndGameButton({ isAdmin, lobbyState, onEndGame }: EndGameButtonProps) {
  const { t } = useTranslation('common');
  const [confirming, setConfirming] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!isAdmin || lobbyState !== 'PLAYING') return null;

  const handleClick = () => {
    clearTimeout(timeoutRef.current);
    if (confirming) {
      setConfirming(false);
      onEndGame?.();
    } else {
      setConfirming(true);
      timeoutRef.current = setTimeout(() => setConfirming(false), 1000);
    }
  };

  return (
    <Button
      variant={confirming ? 'negative' : 'basic'}
      className={cn(!confirming && 'text-negative')}
      onClick={handleClick}
    >
      {confirming ? t('playerList.confirmEndGame') : t('playerList.endGame')}
    </Button>
  );
}
