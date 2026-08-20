import type {
  HTMLAttributes,
  ReactNode,
  Ref,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { cn } from '@/components/lib/cn';

type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** Minimal borders (no outer frame). */
  basic?: boolean;
  /** Tighter cell padding. */
  compact?: boolean;
  /** No responsive stacking. Accepted for API compatibility; the table always scrolls instead. */
  unstackable?: boolean;
  /** Accessible table caption, rendered as a real `<caption>` element. */
  caption?: ReactNode;
  ref?: Ref<HTMLTableElement>;
};

/**
 * Data table. Compose with the Table* sub-components below.
 *
 * Deliberately NOT wrapped in an `overflow-x-auto` container: that clipped the table's own ambient
 * shadow flush against its edge, and made long cell content scroll sideways instead of wrapping.
 * Cells wrap (`break-words` on `.ooc-table td`), so the table never forces the page wider.
 */
export function Table({
  basic = false,
  compact = false,
  unstackable = false,
  caption,
  className,
  children,
  ref,
  ...props
}: TableProps) {
  return (
    <table
      ref={ref}
      data-unstackable={unstackable ? '' : undefined}
      className={cn(
        'ooc-table align-middle',
        compact && '[&_td]:px-2 [&_td]:py-1 [&_th]:px-2 [&_th]:py-1',
        basic && 'border-0 bg-none shadow-none',
        className,
      )}
      {...props}
    >
      {caption != null && (
        <caption className="caption px-3 py-2 text-left text-text-subtle">{caption}</caption>
      )}
      {children}
    </table>
  );
}

type TableSectionProps = HTMLAttributes<HTMLTableSectionElement> & {
  ref?: Ref<HTMLTableSectionElement>;
};

export function TableHeader({ className, ref, ...props }: TableSectionProps) {
  return <thead ref={ref} className={className} {...props} />;
}

export function TableBody({ className, ref, ...props }: TableSectionProps) {
  return <tbody ref={ref} className={className} {...props} />;
}

type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Yellow highlight row (the same marker language as a repaired word) - e.g. the local player. */
  marked?: boolean;
  /** Green tint (e.g. a ready player). */
  positive?: boolean;
  /** Red tint (e.g. a disconnected player). */
  negative?: boolean;
  ref?: Ref<HTMLTableRowElement>;
};

export function TableRow({
  marked = false,
  positive = false,
  negative = false,
  className,
  ref,
  ...props
}: TableRowProps) {
  return (
    <tr
      ref={ref}
      className={cn(
        marked && 'row-marked',
        positive && 'bg-positive/15 font-medium',
        negative && 'bg-negative/15 font-medium',
        className,
      )}
      {...props}
    />
  );
}

type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  ref?: Ref<HTMLTableCellElement>;
};

export function TableHeaderCell({ scope = 'col', className, ref, ...props }: TableHeaderCellProps) {
  // Font, padding, and uppercase treatment come from `.ooc-table th` (index.css).
  return <th ref={ref} scope={scope} className={cn('align-middle', className)} {...props} />;
}

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & {
  ref?: Ref<HTMLTableCellElement>;
};

export function TableCell({ className, ref, ...props }: TableCellProps) {
  return <td ref={ref} className={cn('px-3 py-2 align-middle', className)} {...props} />;
}
