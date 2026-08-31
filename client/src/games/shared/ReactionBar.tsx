import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import { Button } from '@/components/ui/Button/Button';
import { Icon } from '@/components/ui/Icon/Icon';
import { REACTION_IDS, REACTION_STYLE, type ReactionId } from './reactions';

// Matches the float keyframe in index.css.
const FLOAT_MS = 1400;

export interface ReactionBarProps {
  /** Count per reaction for this chain. */
  counts: Record<ReactionId, number>;
  /** Whether THIS player has left each reaction (one of each, max). */
  mine: Record<ReactionId, boolean>;
  /** False for spectators / post-game: the bar becomes a read-only tally. */
  canReact: boolean;
  onReact: (reaction: ReactionId) => void;
  /** Reactions other players just left here, floating up. */
  floats?: Array<{ key: string; reaction: string }>;
}

/**
 * The reaction row under a chain: one toggle per reaction, each showing its count.
 *
 * A player may hold at most one of EACH reaction, so every button is an independent toggle rather
 * than a single choice. Pressing responds immediately - the button colours and floats without
 * waiting for the server - and the confirmed state from `mine` takes back over once it arrives.
 */
export function ReactionBar({ counts, mine, canReact, onReact, floats = [] }: ReactionBarProps) {
  const { t } = useTranslation('game-common');
  // What we have pressed but not yet seen confirmed, and the floats we fired for ourselves.
  const [pending, setPending] = useState<Partial<Record<ReactionId, boolean>>>({});
  const [ownFloats, setOwnFloats] = useState<Array<{ key: string; reaction: ReactionId }>>([]);
  const floatSeq = useRef(0);

  // Drop each optimistic value the moment the server agrees with it. Adjusted during render rather
  // than in an effect (the same guarded-setState pattern used elsewhere here) so the confirmed state
  // is applied before paint, with no intermediate frame showing the stale guess. Keyed on a
  // signature because `mine` is a fresh object every render.
  const confirmed = REACTION_IDS.map((id) => (mine[id] ? '1' : '0')).join('');
  const [seen, setSeen] = useState(confirmed);
  if (seen !== confirmed) {
    setSeen(confirmed);
    setPending((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([id]) => prev[id as ReactionId] !== mine[id as ReactionId]),
      );
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });
  }

  const press = useCallback(
    (id: ReactionId, active: boolean) => {
      setPending((prev) => ({ ...prev, [id]: !active }));
      if (!active) {
        const key = `own-${++floatSeq.current}`;
        setOwnFloats((prev) => [...prev, { key, reaction: id }]);
        setTimeout(() => setOwnFloats((prev) => prev.filter((f) => f.key !== key)), FLOAT_MS);
      }
      onReact(id);
    },
    [onReact],
  );

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {REACTION_IDS.map((id) => {
        const style = REACTION_STYLE[id];
        const count = counts[id] ?? 0;
        const active = pending[id] ?? mine[id];
        const label = t(`reactions.${id}`);
        // A pressed reaction has not been counted by the server yet, so show it in the tally now.
        const shown = pending[id] === undefined ? count : count + (pending[id] ? 1 : -1);

        // Spectators and post-game viewers see the tally without a control they cannot use.
        if (!canReact) {
          return (
            <span
              key={id}
              aria-label={`${label}: ${count}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm tabular-nums',
                count > 0 ? style.tint : 'text-text-subtle',
              )}
            >
              <Icon name={style.icon} size="sm" />
              {count}
            </span>
          );
        }

        return (
          // Anchors this reaction's floats, so one rises from the button it belongs to.
          <span key={id} className="relative inline-flex">
            {[
              ...floats.filter((f) => f.reaction === id),
              ...ownFloats.filter((f) => f.reaction === id),
            ].map(({ key }) => (
              <span key={key} aria-hidden="true" className={cn('ooc-reaction-float', style.tint)}>
                <Icon name={style.icon} size="lg" />
              </span>
            ))}
            <Button
              size="sm"
              compact
              variant="secondary"
              // Pressed swaps the whole skin to the reaction's colour, the same filled treatment as
              // any other coloured button. Unpressed stays the plain neutral control.
              color={active ? style.color : undefined}
              icon={style.icon}
              aria-pressed={active}
              // aria-label overrides content, so the count has to be in here or it is never
              // announced. Same `label: count` shape as the read-only variant above.
              aria-label={`${label}: ${Math.max(0, shown)}`}
              className="tabular-nums"
              onClick={() => press(id, active)}
            >
              {Math.max(0, shown)}
            </Button>
          </span>
        );
      })}
    </div>
  );
}
