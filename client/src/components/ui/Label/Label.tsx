import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/components/lib/cn';
import { Icon } from '@/components/ui/Icon/Icon';
import type { IconName } from '@/components/ui/Icon/icon-map';

// Filled as a soft tint of the token so the label stays legible in both themes (the token text
// color flips; its 15% tint follows).
type LabelColor = 'primary' | 'positive' | 'negative' | 'warning' | 'info' | 'neutral';
type LabelSize = 'sm' | 'md' | 'lg';
type LabelAttached = 'top left' | 'top right' | 'bottom left' | 'bottom right';

const COLOR: Record<LabelColor, string> = {
  primary: 'bg-primary/15 text-primary',
  positive: 'bg-positive/15 text-positive',
  negative: 'bg-negative/15 text-negative',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-info/15 text-info',
  neutral: 'bg-surface-2 text-text-muted',
};

const SIZE: Record<LabelSize, string> = {
  sm: 'gap-1 px-1.5 py-0.5 text-[10px]',
  md: 'gap-1 px-2 py-0.5 text-[11px]',
  lg: 'gap-1.5 px-2.5 py-1 text-xs',
};

// Absolute-positioned corner variants (parent must be `relative`). Squares off the anchored corner.
const ATTACHED: Record<LabelAttached, string> = {
  'top left': 'absolute top-0 left-0 rounded-none rounded-br-md',
  'top right': 'absolute top-0 right-0 rounded-none rounded-bl-md',
  'bottom left': 'absolute bottom-0 left-0 rounded-none rounded-tr-md',
  'bottom right': 'absolute bottom-0 right-0 rounded-none rounded-tl-md',
};

export interface LabelProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  color?: LabelColor;
  size?: LabelSize;
  icon?: IconName;
  attached?: LabelAttached;
  children?: ReactNode;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * Compact inline tag for lobby codes, counts, and status markers. Status text is uppercase Hanken at
 * 0.12em tracking (theme.md) -- mono stays reserved for codes/scores.
 */
export function Label({
  color = 'neutral',
  size = 'md',
  icon,
  attached,
  className,
  children,
  ref,
  ...props
}: LabelProps) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-md border border-current font-medium uppercase leading-none tracking-[0.12em]',
        COLOR[color],
        SIZE[size],
        attached && ATTACHED[attached],
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size="sm" />}
      {children}
    </span>
  );
}
