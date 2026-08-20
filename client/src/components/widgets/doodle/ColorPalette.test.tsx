import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DRAWING_PALETTE } from '@/data/theme';
import { ColorPalette } from './ColorPalette';

describe('ColorPalette', () => {
  it('renders one swatch per palette colour by default', () => {
    render(<ColorPalette selected={DRAWING_PALETTE[0]} onSelect={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(DRAWING_PALETTE.length);
  });

  it('includes the white and tan swatches', () => {
    render(<ColorPalette selected={DRAWING_PALETTE[0]} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: '#ffffff' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '#d9bd8f' })).toBeInTheDocument();
  });

  it('calls onSelect with the clicked colour value', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ColorPalette selected={DRAWING_PALETTE[0]} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: DRAWING_PALETTE[3] }));
    expect(onSelect).toHaveBeenCalledWith(DRAWING_PALETTE[3]);
  });

  it('marks the selected swatch with the solid circle', () => {
    render(<ColorPalette selected={DRAWING_PALETTE[2]} onSelect={() => {}} />);
    const selected = screen.getByRole('button', { name: DRAWING_PALETTE[2] });
    expect(selected).toHaveAttribute('aria-pressed', 'true');
    const marker = selected.querySelector('i')!;
    expect(marker.className).toContain('fa-solid');
    expect(marker.className).not.toContain('opacity-0');
  });

  it('gives every other swatch a hollow circle that only appears on hover or focus', () => {
    render(<ColorPalette selected={DRAWING_PALETTE[2]} onSelect={() => {}} />);
    const other = screen.getByRole('button', { name: DRAWING_PALETTE[3] });
    const marker = other.querySelector('i')!;
    // Outline, from the regular face - the solid style must NOT also be applied, or the two rules
    // fight over font-weight and the glyph fills in.
    expect(marker.className).toContain('fa-regular');
    expect(marker.className).not.toContain('fa-solid');
    // Hidden until hover/focus. jsdom does not evaluate the cascade, so this asserts the wiring.
    expect(marker.className).toContain('opacity-0');
    expect(marker.className).toContain('group-hover:opacity-100');
  });

  it('does not dim the swatch on hover, which would misrepresent the colour', () => {
    render(<ColorPalette selected={DRAWING_PALETTE[0]} onSelect={() => {}} />);
    for (const swatch of screen.getAllByRole('button')) {
      expect(swatch.className).not.toContain('brightness');
    }
  });
});
