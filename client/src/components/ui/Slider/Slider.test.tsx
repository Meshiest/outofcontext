import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Slider } from './Slider';

describe('Slider', () => {
  it('renders a range input with the given min/max', () => {
    render(<Slider label="Volume" min={3} max={30} defaultValue={10} />);
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('min', '3');
    expect(slider).toHaveAttribute('max', '30');
  });

  it('updates its displayed value on interaction', () => {
    render(<Slider label="Stroke width" min={3} max={30} defaultValue={8} showValue />);
    expect(screen.getByText('8')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider', { name: 'Stroke width' }), {
      target: { value: '20' },
    });
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('fires onChange when the value changes', () => {
    const onChange = vi.fn();
    render(<Slider label="Volume" onChange={onChange} defaultValue={5} />);
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '7' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('respects a controlled value', () => {
    render(<Slider label="Volume" value={25} min={0} max={100} showValue />);
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveValue('25');
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('forwards ref to the native range input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Slider ref={ref} label="Volume" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
