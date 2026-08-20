import { useTranslation } from 'react-i18next';
import { Divider } from '@/components/ui/Divider/Divider';
import { Icon } from '@/components/ui/Icon/Icon';
import { Doodle } from '@/components/widgets/doodle/Doodle';
import { Attribution } from '@/games/shared/Attribution';
import type { DrawEntry } from './types';

export interface DrawChainDisplayProps {
  entries: DrawEntry[];
  nameTable: Record<string, string>;
}

/**
 * Renders a single alternating describe/draw chain: descriptions in the editorial serif, drawings as
 * read-only Doodles, each with right-aligned author attribution. When the chain is odd-length (it
 * starts and ends with a description), a "Journey" summary compares the first and last
 * descriptions so readers can see how far the meaning drifted.
 */
export function DrawChainDisplay({ entries, nameTable }: DrawChainDisplayProps) {
  const { t } = useTranslation('game-draw');

  const isOdd = entries.length % 2 === 1;
  const first = entries[0];
  const last = entries[entries.length - 1];
  const firstDesc = first?.link.type === 'desc' ? first.link.data : undefined;
  const lastDesc = last?.link.type === 'desc' ? last.link.data : undefined;
  const showSummary = isOdd && firstDesc !== undefined && lastDesc !== undefined;

  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, index) => (
        <div key={index} className="flex flex-col gap-1">
          {entry.link.type === 'desc' ? (
            <p className="story-body px-1 text-center">{entry.link.data}</p>
          ) : (
            <div className="overflow-x-auto">
              <Doodle readOnly className="rounded-lg" image={entry.link.data} />
            </div>
          )}
          {nameTable[entry.editor] && (
            <Attribution name={nameTable[entry.editor]} className="px-1" />
          )}
        </div>
      ))}

      {showSummary && (
        <div>
          <Divider>{t('journey')}</Divider>
          <p className="story-body px-1 text-center">{firstDesc}</p>
          <div aria-hidden className="my-1 flex justify-center text-text-muted">
            <Icon name="arrow down" size="sm" />
          </div>
          <p className="story-body px-1 text-center">{lastDesc}</p>
        </div>
      )}
    </div>
  );
}
