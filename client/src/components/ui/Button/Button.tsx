import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/components/lib/cn';
import { Icon } from '@/components/ui/Icon/Icon';
import type { IconName } from '@/components/ui/Icon/icon-map';

type ButtonVariant = 'primary' | 'secondary' | 'positive' | 'negative' | 'basic';
type ButtonSize = 'sm' | 'md' | 'lg';
/** Color override (green -> positive, red -> negative, blue -> primary). */
type ButtonColor = 'green' | 'red' | 'blue' | 'orange' | 'grey' | 'pink' | 'slate';

type Skin = 'primary' | 'positive' | 'negative' | 'warn' | 'neutral' | 'ghost' | 'pink' | 'slate';

// Pressed-smooth skins live in index.css (@layer components): a vertical gradient of the hue,
// a darker outline, a white inset top edge, cursor:pointer, and a 1px press into an inset
// shadow. Filled skins keep the SAME hue in both themes; neutral/ghost flip via tokens. Icons
// get a lighter debossed tint via the .btn-ico class.
const SKIN: Record<Skin, string> = {
  primary: 'btn-skin btn-primary',
  positive: 'btn-skin btn-positive',
  negative: 'btn-skin btn-negative',
  warn: 'btn-skin btn-warn',
  neutral: 'btn-skin btn-neutral',
  ghost: 'btn-skin btn-ghost',
  // Filled hues the semantic set does not cover; used by the reactions (brain, skull).
  pink: 'btn-skin btn-pink',
  slate: 'btn-skin btn-slate',
};

const VARIANT_SKIN: Record<ButtonVariant, Skin> = {
  primary: 'primary',
  positive: 'positive',
  negative: 'negative',
  secondary: 'neutral',
  basic: 'ghost',
};

const COLOR_SKIN: Record<ButtonColor, Skin> = {
  green: 'positive',
  red: 'negative',
  blue: 'primary',
  orange: 'warn',
  grey: 'neutral',
  pink: 'pink',
  slate: 'slate',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3 text-[11px]',
  md: 'h-11 gap-2 px-4 text-[13px]',
  lg: 'h-12 gap-2.5 px-5 text-[15px]',
};

// Icon-only buttons are square (width = height), no horizontal padding, larger glyph.
const SIZE_ICON: Record<ButtonSize, string> = {
  sm: 'size-9 text-sm',
  md: 'size-11 text-base',
  lg: 'size-12 text-lg',
};

// On a wide (fullWidth) button the icon is pinned to the left/right edge (absolutely positioned at
// the size's horizontal padding) so the label stays centered in the full width instead of the
// icon+label pair sitting together in the middle.
const ICON_INSET_LEFT: Record<ButtonSize, string> = { sm: 'left-3', md: 'left-4', lg: 'left-5' };
const ICON_INSET_RIGHT: Record<ButtonSize, string> = {
  sm: 'right-3',
  md: 'right-4',
  lg: 'right-5',
};

type ButtonRounding = 'none' | 'sm' | 'md' | 'lg' | 'full';

// Overrides the skin's default radius.
const ROUNDING: Record<ButtonRounding, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  /** Icon name (mapped via <Icon>) or any node. */
  icon?: IconName | ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
  /** Corner rounding: `none` (square), `sm`, `md` (default), `lg`, or `full` (pill). */
  rounded?: ButtonRounding;
  /** Square icon-only button (no label). Combine with rounded="full" for a circle. */
  iconButton?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

function renderIcon(icon: IconName | ReactNode, size: ButtonSize) {
  if (typeof icon === 'string') {
    return <Icon name={icon} size={size === 'lg' ? 'md' : 'sm'} className="btn-ico" />;
  }
  return icon;
}

/** Renders a real <button> in the pressed-smooth language (skins in index.css). */
export function Button({
  variant = 'primary',
  size = 'md',
  color,
  icon,
  iconPosition = 'left',
  loading = false,
  compact = false,
  fullWidth = false,
  rounded = 'md',
  iconButton = false,
  disabled = false,
  type = 'button',
  className,
  children,
  ref,
  ...props
}: ButtonProps) {
  const skin = color ? COLOR_SKIN[color] : VARIANT_SKIN[variant];

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center border font-sans font-bold uppercase leading-none tracking-[0.1em] whitespace-nowrap',
        // Letter-spacing is applied AFTER each character, including the last, so on an icon-only
        // button it adds a phantom 0.1em to the right of the glyph and the icon sits visibly left
        // of centre. Most obvious on the round ones, where the eye has a circle to compare against.
        iconButton && 'tracking-normal',
        iconButton ? SIZE_ICON[size] : SIZE[size],
        SKIN[skin],
        ROUNDING[rounded],
        !iconButton && compact && 'px-2',
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {/* The loading dots take the LEFT icon's slot (replacing it), not a spot before the label:
          on a wide button that means the icon's absolute left-edge position. */}
      {loading ? (
        fullWidth ? (
          <span
            aria-hidden="true"
            className={cn(
              'absolute top-1/2 inline-flex -translate-y-1/2 items-center',
              ICON_INSET_LEFT[size],
            )}
          >
            <span className="btn-dots">
              <span />
              <span />
              <span />
            </span>
          </span>
        ) : (
          <span aria-hidden="true" className="btn-dots">
            <span />
            <span />
            <span />
          </span>
        )
      ) : (
        icon &&
        iconPosition === 'left' &&
        (fullWidth ? (
          <span
            className={cn(
              'absolute top-1/2 inline-flex -translate-y-1/2 items-center',
              ICON_INSET_LEFT[size],
            )}
          >
            {renderIcon(icon, size)}
          </span>
        ) : (
          renderIcon(icon, size)
        ))
      )}
      {children != null && <span>{children}</span>}
      {!loading &&
        icon &&
        iconPosition === 'right' &&
        (fullWidth ? (
          <span
            className={cn(
              'absolute top-1/2 inline-flex -translate-y-1/2 items-center',
              ICON_INSET_RIGHT[size],
            )}
          >
            {renderIcon(icon, size)}
          </span>
        ) : (
          renderIcon(icon, size)
        ))}
    </button>
  );
}
