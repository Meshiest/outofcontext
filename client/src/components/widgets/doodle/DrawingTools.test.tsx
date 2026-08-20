import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DRAWING_PALETTE } from '@/data/theme';
import { DrawingTools } from './DrawingTools';

function renderTools(overrides: Partial<Parameters<typeof DrawingTools>[0]> = {}) {
  const props = {
    color: DRAWING_PALETTE[0],
    strokeWidth: 3,
    onColorChange: vi.fn(),
    onStrokeWidthChange: vi.fn(),
    ...overrides,
  };
  render(<DrawingTools {...props} />);
  return props;
}

describe('DrawingTools', () => {
  it('renders one button per palette colour plus the stroke slider', () => {
    renderTools();
    expect(screen.getAllByRole('button')).toHaveLength(DRAWING_PALETTE.length);
    expect(screen.getByRole('slider', { name: 'Stroke width' })).toBeInTheDocument();
  });

  it('names the palette group so removing the visible label does not lose it', () => {
    renderTools();
    expect(screen.getByRole('group', { name: 'Color' })).toBeInTheDocument();
  });

  it('reports the selected colour via aria-pressed', () => {
    renderTools({ color: DRAWING_PALETTE[2] });
    expect(screen.getByRole('button', { name: DRAWING_PALETTE[2] })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: DRAWING_PALETTE[0] })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('fires onColorChange with the chosen swatch', async () => {
    const user = userEvent.setup();
    const props = renderTools();
    await user.click(screen.getByRole('button', { name: DRAWING_PALETTE[4] }));
    expect(props.onColorChange).toHaveBeenCalledWith(DRAWING_PALETTE[4]);
  });
});
