import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { STROKE_MAX, STROKE_MIN } from '@shared/drawing';
import { StrokeWidthSlider } from './StrokeWidthSlider';

describe('StrokeWidthSlider', () => {
  it('renders a range bounded by the logical stroke limits', () => {
    render(<StrokeWidthSlider value={STROKE_MIN} onChange={() => {}} aria-label="Stroke width" />);
    const slider = screen.getByRole('slider', { name: 'Stroke width' });
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('min', String(STROKE_MIN));
    expect(slider).toHaveAttribute('max', String(STROKE_MAX));
  });

  it('fires onChange with the new numeric value', () => {
    const onChange = vi.fn();
    render(<StrokeWidthSlider value={STROKE_MIN} onChange={onChange} aria-label="Stroke width" />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: String(STROKE_MAX) } });
    expect(onChange).toHaveBeenCalledWith(STROKE_MAX);
  });
});
