import type { ReactNode } from 'react';
import { cn } from '@/components/lib/cn';
import { SettingsPanel } from './SettingsPanel';

export interface PageWrapperProps {
  children?: ReactNode;
  className?: string;
  /** Suppress the built-in bottom User Preferences panel (the lobby embeds it in its own layout). */
  hideSettings?: boolean;
}

/**
 * Full-height page shell: renders page content, then the shared `SettingsPanel` pinned below it.
 * Uses `min-h-dvh` (dynamic viewport height) rather than `100vh` so mobile browser chrome does not
 * clip the layout when the address bar shows/hides. Deliberately NOT an overflow container: with
 * `min-h-dvh` and no max height it grows with its content and the document scrolls anyway, so an
 * `overflow-y-auto` here would only serve to become the nearest scrolling ancestor and break
 * `position: sticky` for descendants (the lobby's side rail sticks to the viewport).
 */
export function PageWrapper({ children, className, hideSettings = false }: PageWrapperProps) {
  return (
    <div className={cn('relative min-h-dvh', className)}>
      {children}
      {!hideSettings && <SettingsPanel />}
    </div>
  );
}
