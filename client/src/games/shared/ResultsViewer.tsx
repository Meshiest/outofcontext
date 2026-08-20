import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Divider } from '@/components/ui/Divider/Divider';
import { Loader } from '@/components/ui/Loader/Loader';
import { Scrollable } from '@/components/ui/Scrollable/Scrollable';

export interface ResultsViewerProps {
  /** Already-translated section title (e.g. "Stories", "Sequences", "Chains"). */
  title: string;
  children: ReactNode;
}

/**
 * Reading-phase wrapper: a titled divider, a loading spinner until content arrives, and a
 * left-aligned container for the game-specific chain rendering.
 *
 * On desktop the results get their own scroll region rather than growing the page, which keeps the
 * Done Reading control reachable however many chains there are - and gives them the drawn scrollbar
 * instead of the page's. On small screens the page scrolls as before.
 */
export function ResultsViewer({ title, children }: ResultsViewerProps) {
  const { t } = useTranslation('game-common');
  const hasContent = Array.isArray(children)
    ? children.length > 0
    : children != null && children !== false;

  return (
    <div className="w-full text-left">
      <Divider>{title}</Divider>
      {hasContent ? (
        <Scrollable viewportClassName="lg:max-h-[calc(100dvh-18rem)] lg:overflow-y-auto lg:pr-6">
          {children}
        </Scrollable>
      ) : (
        <Loader size="lg" centered label={t('loadingResults')}>
          {t('loadingResults')}
        </Loader>
      )}
    </div>
  );
}
