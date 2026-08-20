import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';

/**
 * The 16 emotes players can send, in display order. The values are Icon component names (mapped to
 * Font Awesome glyphs); emote names are data, not translated copy.
 */
export const EMOTE_MAP = [
  'smile',
  'meh',
  'frown',
  'heart',
  'bug',
  'hand rock',
  'hand paper',
  'hand scissors',
  'question',
  'exclamation',
  'wait',
  'write',
  'check',
  'times',
  'thumbs up',
  'thumbs down',
] as const;

export interface EmoteBarProps {
  /** Called with the chosen emote name. */
  onSendEmote: (emote: string) => void;
  /** Whether the popup is visible. */
  isOpen: boolean;
  /** The toggle button the popup is positioned against. */
  anchorRef?: RefObject<HTMLButtonElement | null>;
  /** Asked to close (the page scrolled out from under the popup). */
  onRequestClose?: () => void;
}

// Keep the popup clear of the anchor and the viewport edges.
const GAP = 8;
const MARGIN = 8;
// Tailwind's `lg` breakpoint - the width at which the player list becomes a side rail and there is
// somewhere sensible for the popup to open sideways into.
const DESKTOP_MIN_WIDTH = 1024;
const DESKTOP_QUERY = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;

/** `matchMedia` is absent in jsdom (and old browsers); fall back to comparing the viewport width. */
function isDesktopWidth(): boolean {
  if (typeof window.matchMedia === 'function') return window.matchMedia(DESKTOP_QUERY).matches;
  return window.innerWidth >= DESKTOP_MIN_WIDTH;
}

/**
 * Popup 4x4 grid of emote buttons, anchored to the emote toggle.
 *
 * It is PORTALED to <body> and positioned with fixed coordinates: the player list lives in a side
 * rail that is its own scroll container on desktop (`overflow-y-auto`), which would otherwise clip
 * an in-flow popup on every side. Placement is chosen from the room actually available - out to the
 * right when there is space (the desktop rail) and upward otherwise (the stacked mobile column).
 *
 * It is positioned once per open and does NOT track scrolling; scrolling closes it instead, which is
 * what a popover detached from its trigger should do.
 */
export function EmoteBar({ onSendEmote, isOpen, anchorRef, onRequestClose }: EmoteBarProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!isOpen) return;
    const update = () => {
      const anchor = anchorRef?.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const rect = anchor.getBoundingClientRect();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;

      // Desktop opens to the right of the toggle (into the space beside the rail); mobile and tablet
      // open upward, where the list is a stacked full-width section with nothing useful to the side.
      const roomRight = window.innerWidth - rect.right;
      const toRight = isDesktopWidth() && roomRight >= width + GAP + MARGIN;
      let left = toRight ? rect.right + GAP : rect.right - width;
      let top = toRight ? rect.top : rect.top - height - GAP;

      // Clamp inside the viewport so it never renders half off-screen.
      left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN));
      top = Math.max(MARGIN, Math.min(top, window.innerHeight - height - MARGIN));
      setStyle({ left, top });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isOpen, anchorRef]);

  // Any scroll (page or the rail's own scroller, hence capture phase) moves the toggle out from
  // under the popup, so dismiss it rather than letting it hang in the viewport.
  useEffect(() => {
    if (!isOpen || !onRequestClose) return;
    const close = () => onRequestClose();
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [isOpen, onRequestClose]);

  return createPortal(
    <Card
      ref={panelRef}
      hidden={!isOpen}
      style={{ position: 'fixed', ...style }}
      className="z-50 w-44 p-2"
    >
      <div className="grid grid-cols-4 place-items-center gap-1">
        {EMOTE_MAP.map((emote) => (
          <Button
            key={emote}
            iconButton
            rounded="full"
            size="sm"
            variant="basic"
            icon={emote}
            aria-label={emote}
            className="text-text-muted"
            onClick={() => onSendEmote(emote)}
          />
        ))}
      </div>
    </Card>,
    document.body,
  );
}
