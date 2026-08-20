import { cn } from '@/components/lib/cn';
import { Icon } from '@/components/ui/Icon/Icon';
import { DRAWING_PALETTE } from '@/data/theme';

/**
 * Shared treatment for both markers. White with a dark halo, because a swatch can be any colour in
 * the palette - including white and near-black - and a single flat colour would vanish against one
 * end or the other.
 *
 * The hover ring is drawn larger than the selected dot: an outline reads lighter than a filled disc
 * at the same size, and at a larger diameter it sits AROUND where the dot will land rather than
 * competing with it.
 */
const MARKER = 'text-white [text-shadow:0_0_2px_rgba(20,18,15,0.9)]';

export interface ColorPaletteProps {
  /** Swatch colours (CSS values). Defaults to the theme drawing palette (14 colours). */
  colors?: readonly string[];
  /** Currently selected colour. */
  selected: string;
  /** Called with the chosen colour. */
  onSelect: (color: string) => void;
  /** Accessible name for the swatch group (the toolbar renders no visible label). */
  'aria-label'?: string;
  className?: string;
}

/**
 * Grid of colour swatches for the drawing canvas: wide and short beneath the canvas on small screens
 * (8 x 2), narrow and tall beside it on desktop (2 x 8). Swatches are >=44px tap targets on mobile
 * and tighten up on desktop where there is no thumb to accommodate. Each swatch carries an inset
 * hairline so the near-white entries still read as swatches, and the selected marker is ringed so it
 * stays visible on light and dark colours alike. Labelled by colour value for a11y and testing.
 */
export function ColorPalette({
  colors = DRAWING_PALETTE,
  selected,
  onSelect,
  'aria-label': ariaLabel,
  className,
}: ColorPaletteProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'grid grid-cols-8 grid-rows-2 overflow-hidden rounded-md border border-border-soft shadow-sm lg:grid-cols-2 lg:grid-rows-8',
        className,
      )}
    >
      {colors.map((color) => {
        const isSelected = color === selected;
        return (
          <button
            key={color}
            type="button"
            aria-label={color}
            aria-pressed={isSelected}
            onClick={() => onSelect(color)}
            style={{ backgroundColor: color }}
            // No hover filter: dimming the swatch misrepresents the colour you are about to pick.
            // The hover affordance is the outline marker below, which previews exactly where the
            // solid one will land.
            className="group flex aspect-square min-h-11 cursor-pointer items-center justify-center shadow-[inset_0_0_0_1px_rgba(20,18,15,0.10)] lg:min-h-8"
          >
            {isSelected ? (
              <Icon name="circle" size="sm" className={MARKER} />
            ) : (
              <Icon
                name="circle outline"
                size="lg"
                // Revealed on focus as well as hover, so keyboard users get the same preview.
                className={cn(
                  MARKER,
                  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none',
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
