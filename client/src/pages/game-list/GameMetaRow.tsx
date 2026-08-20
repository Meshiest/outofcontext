import { useTranslation } from 'react-i18next';
import type { GameMeta } from '@shared/types';
import { cn } from '@/components/lib/cn';
import { Icon } from '@/components/ui/Icon/Icon';
import { gameCopy } from '@/lib/gameCopy';
import { formatPlayerRange } from './playerRange';

export interface GameMetaRowProps {
  /** The gameInfo key, which selects the locale namespace the play time and difficulty come from. */
  gameKey: string;
  meta: GameMeta;
  className?: string;
}

/** Play time, player range, and difficulty. The range is derived from the config bounds. */
export function GameMetaRow({ gameKey, meta, className }: GameMetaRowProps) {
  const { t, i18n } = useTranslation('gameList');
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="clock" label={t('labels.playTime')} />
        {gameCopy(i18n, gameKey, 'playTime')}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="users" label={t('labels.players')} />
        {formatPlayerRange(meta.config.players)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Icon name="fire" label={t('labels.difficulty')} />
        {gameCopy(i18n, gameKey, 'difficulty')}
      </span>
    </div>
  );
}
