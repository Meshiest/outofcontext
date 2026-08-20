import { useTranslation } from 'react-i18next';
import type { GameMeta } from '@shared/types';
import { cn } from '@/components/lib/cn';
import { gameCopy } from '@/lib/gameCopy';
import { GameMetaRow } from './GameMetaRow';

export interface GameSummaryCardProps {
  /** The gameInfo key (e.g. "story"), passed back on select and selecting its locale namespace. */
  gameKey: string;
  meta: GameMeta;
  selected: boolean;
  onSelect: (gameKey: string) => void;
}

/**
 * One game in the desktop catalogue's left rail: title, tagline, blurb, and the play time / players
 * / difficulty row. The whole card is the control that opens that game in the detail panel, so it
 * renders as a real button rather than a div with a click handler.
 */
export function GameSummaryCard({ gameKey, meta, selected, onSelect }: GameSummaryCardProps) {
  const { i18n } = useTranslation('gameList');
  const subtitle = gameCopy(i18n, gameKey, 'subtitle');

  return (
    <button
      type="button"
      data-game-card={gameKey}
      aria-pressed={selected}
      onClick={() => onSelect(gameKey)}
      className={cn(
        'surface-raised w-full cursor-pointer rounded-lg px-4 py-3 text-left',
        // Slides right rather than lifting: the rail reads as a list being pointed at, and the
        // selected card sits furthest out, so its offset alone shows which game is open - no border
        // recolouring needed on top of it.
        'transition-transform duration-150 ease-out motion-reduce:transition-none',
        selected ? 'translate-x-2 shadow-md' : 'hover:translate-x-1 focus-visible:translate-x-1',
      )}
    >
      <span className="block font-display text-xl leading-tight text-text">
        {gameCopy(i18n, gameKey, 'title')}
      </span>
      {subtitle && (
        <span className="mt-0.5 block font-sans text-sm italic text-text-muted">{subtitle}</span>
      )}
      <span className="mt-2 block text-sm text-text">{gameCopy(i18n, gameKey, 'description')}</span>
      <GameMetaRow gameKey={gameKey} meta={meta} className="mt-3 text-xs text-text-muted" />
    </button>
  );
}
