import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button/Button';

export interface DrawingToolbarProps {
  /** Live stroke count; drives Undo/Done enablement. */
  strokeCount: number;
  /** Canvas is locked (timed-draw expiry): Undo is disabled but Done stays available. */
  isReadOnly?: boolean;
  /** Force the Done button disabled (e.g. submission in flight / not this player's turn). */
  disabled?: boolean;
  /** Undone strokes available to put back; 0 disables Redo. */
  redoCount?: number;
  /** The drawing is uploading: Done shows a spinner and cannot be pressed again. */
  submitting?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDone: () => void;
}

/**
 * The drawing actions beneath the canvas: Undo (left) and Done (right). The colour palette and
 * stroke-width picker are a separate component (`DrawingTools`) because they move beside the canvas
 * on desktop. Copy is translated (common:doodle.*).
 */
export function DrawingToolbar({
  strokeCount,
  isReadOnly = false,
  disabled = false,
  redoCount = 0,
  submitting = false,
  onUndo,
  onRedo,
  onDone,
}: DrawingToolbarProps) {
  const { t } = useTranslation('common');
  const undoDisabled = strokeCount === 0 || isReadOnly || submitting;
  const doneDisabled = (strokeCount === 0 && !isReadOnly) || disabled;

  return (
    <div className="flex items-center p-2">
      <Button variant="secondary" size="sm" icon="undo" disabled={undoDisabled} onClick={onUndo}>
        {t('doodle.undo')}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        icon="redo"
        className="ml-2"
        disabled={redoCount === 0 || isReadOnly || submitting}
        onClick={onRedo}
      >
        {t('doodle.redo')}
      </Button>
      <span className="flex-1" />
      <Button
        variant="primary"
        size="sm"
        icon="check"
        loading={submitting}
        disabled={doneDisabled}
        onClick={onDone}
      >
        {t('doodle.done')}
      </Button>
    </div>
  );
}
