import { cn } from '@/components/lib/cn';
import { RedactedLine } from './RedactedLine';
import type { RedactedLineSegment } from './redactedUtils';

export interface RedactedLinePreviewProps {
  /** Rendered line segments: punctuation/string plain, word/count as redaction bars. */
  line: RedactedLineSegment[];
  className?: string;
}

/**
 * Read-only display of a previously-processed line with redaction styling. Used to show the
 * continue-the-story context (above the write editor) and repair context. Delegates the segment
 * rendering to RedactedLine so the redaction visual stays identical everywhere.
 */
export function RedactedLinePreview({ line, className }: RedactedLinePreviewProps) {
  return <RedactedLine segments={line} className={cn('my-3', className)} />;
}
