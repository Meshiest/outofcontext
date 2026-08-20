import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import { drawingUrl } from '@/data/drawings';

/**
 * Resolve what to put in `src`.
 *
 * Normally this is a drawing id, which maps to its cacheable blob URL. A data URL is passed straight
 * through so a story or a test can render a self-contained image without a server behind it.
 */
function resolveSrc(image: string): string {
  return image.startsWith('data:') ? image : drawingUrl(image);
}

export interface ReadOnlyDrawingProps {
  /** Drawing id (or a data URL, for stories). */
  image?: string;
  /** Optional attribution shown top-right, fading after 2s and revealed on hover. */
  author?: string;
  /** Merged onto the frame. Callers use it for corner rounding, which differs when drawings stack. */
  className?: string;
}

/**
 * Renders a finished drawing. Because every drawing is a fixed-resolution bitmap, the browser scales
 * it to whatever box it is given - so a drawing made on a phone and one made on a desktop render
 * identically here. An optional author overlay fades to near-invisible after 2s and returns on hover.
 */
export function ReadOnlyDrawing({ image, author, className }: ReadOnlyDrawingProps) {
  const { t } = useTranslation('common');
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    if (!author) return;
    const id = setTimeout(() => setFaded(true), 2000);
    return () => clearTimeout(id);
  }, [author]);

  return (
    <div className={cn('group relative aspect-square w-full overflow-hidden bg-white', className)}>
      {image ? (
        <img
          src={resolveSrc(image)}
          alt=""
          role="presentation"
          draggable={false}
          // Off-screen chains in a long results list should not all fetch at once.
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-contain"
        />
      ) : null}
      {author && (
        <div
          className={cn(
            'absolute right-1 top-1 z-10 rounded bg-black/50 px-2 py-1 text-xs text-white',
            'transition-opacity duration-700 group-hover:opacity-100 motion-reduce:transition-none',
            faded ? 'opacity-5' : 'opacity-100',
          )}
        >
          {t('doodle.author', { name: author })}
        </div>
      )}
    </div>
  );
}
