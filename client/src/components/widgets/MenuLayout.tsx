import type { ReactNode } from 'react';
import { cn } from '@/components/lib/cn';

export interface MenuLayoutProps {
  /** Heading, set in the display serif (Newsreader). A node, so it can carry markup (AppWordmark). */
  title: ReactNode;
  /** Optional italic subtitle in the sans face (Hanken Grotesk). */
  subtitle?: string;
  /** Left-align the content area instead of centering it. */
  leftAlign?: boolean;
  /** Merged onto the outer column (e.g. `max-w-none` to let a parent own the width). */
  className?: string;
  children?: ReactNode;
}

/**
 * Narrow fixed-width centered column (serif title, optional italic subtitle, content slot) used by
 * the home/game-list screens. Colours come from theme tokens, so the title and subtitle flip for
 * dark mode without `dark:` variants.
 */
export function MenuLayout({
  title,
  subtitle,
  leftAlign = false,
  className,
  children,
}: MenuLayoutProps) {
  return (
    <div
      className={cn('mx-auto mb-8 flex w-full max-w-[300px] flex-col p-1 text-center', className)}
    >
      <header className="px-4 pt-8 pb-4">
        <div className="my-2 font-display text-3xl text-text">{title}</div>
        {subtitle !== undefined && (
          <div className="font-sans italic text-text-muted">{subtitle}</div>
        )}
      </header>
      <div className={cn(leftAlign ? 'text-left' : 'text-center')}>{children}</div>
    </div>
  );
}
