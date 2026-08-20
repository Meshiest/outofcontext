import { useTranslation } from 'react-i18next';
import { cn } from '@/components/lib/cn';
import { ColorPalette } from './ColorPalette';
import { StrokeWidthSlider } from './StrokeWidthSlider';

/**
 * The desktop tools column's width and divider.
 *
 * Exported because continuous mode has to reserve the SAME gutter beside the read-only drawing above
 * the canvas - otherwise the two drawings sit at different x offsets and the composition they are
 * supposed to form does not line up. The width is pinned rather than content-derived so it cannot
 * change when a swatch is added.
 */
export const TOOLS_COLUMN_CLASS = 'lg:w-24 lg:shrink-0 lg:border-r lg:border-divider';

export interface DrawingToolsProps {
  /** Available swatch colours. */
  colors?: readonly string[];
  /** Current stroke colour. */
  color: string;
  /** Current stroke width. */
  strokeWidth: number;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  className?: string;
}

/**
 * The drawing configuration controls: colour palette + stroke-width picker.
 *
 * Split out of `DrawingToolbar` because the two groups live in different places: the Undo/Done
 * actions always sit under the canvas, while these tools sit under it on small screens but move
 * beside it - as a vertical column - on desktop, which keeps the canvas as tall as the viewport
 * allows. Both controls carry accessible names instead of visible labels.
 */
export function DrawingTools({
  colors,
  color,
  strokeWidth,
  onColorChange,
  onStrokeWidthChange,
  className,
}: DrawingToolsProps) {
  const { t } = useTranslation('common');
  return (
    <div
      className={cn(
        'flex flex-row flex-wrap items-center justify-center gap-3 p-2 lg:flex-col lg:flex-nowrap lg:justify-start',
        TOOLS_COLUMN_CLASS,
        className,
      )}
    >
      <ColorPalette
        colors={colors}
        selected={color}
        onSelect={onColorChange}
        aria-label={t('doodle.color')}
      />
      <StrokeWidthSlider
        value={strokeWidth}
        onChange={onStrokeWidthChange}
        aria-label={t('doodle.strokeWidth')}
      />
    </div>
  );
}
