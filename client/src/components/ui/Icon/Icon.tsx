import type { HTMLAttributes, Ref } from 'react';
import { cn } from '@/components/lib/cn';
import { ICON_MAP, type IconName } from './icon-map';

export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

// Font Awesome glyphs are 1em tall, so font-size controls the icon size.
const SIZE: Record<IconSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl',
};

export interface IconProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  /** A known icon name (mapped to a Font Awesome glyph). Unknown names render nothing. */
  name: IconName | (string & {});
  size?: IconSize;
  /** Optional color utility class, e.g. `text-primary`. Defaults to currentColor. */
  color?: string;
  /** Accessible label. When omitted (and no aria-label given) the icon is decorative. */
  label?: string;
  ref?: Ref<HTMLElement>;
}

/**
 * Font Awesome (solid) icon, rendered as a webfont `<i>` so the debossed button treatment
 * (`.btn-ico` text-shadow) applies. Unknown names render nothing rather than an error glyph.
 * Decorative by default; pass `label` (or `aria-label`) to expose it as an `img`.
 */
export function Icon({ name, size = 'md', color, label, className, ref, ...props }: IconProps) {
  const glyph = ICON_MAP[name as IconName];
  if (!glyph) return null;
  const { 'aria-label': ariaLabelProp, ...rest } = props;
  const accessibleName = label ?? ariaLabelProp;
  // A map entry may bring its own style class: outline glyphs exist only in the regular face, and
  // stacking `fa-solid` alongside `fa-regular` would leave two rules fighting over the same
  // font-weight. Solid stays the default for every entry that does not say otherwise.
  const hasOwnStyle = /\bfa-(solid|regular|brands)\b/.test(glyph);
  return (
    <i
      ref={ref}
      {...rest}
      className={cn(!hasOwnStyle && 'fa-solid', glyph, SIZE[size], color, className)}
      role={accessibleName ? 'img' : undefined}
      aria-label={accessibleName}
      aria-hidden={accessibleName ? undefined : true}
    />
  );
}
