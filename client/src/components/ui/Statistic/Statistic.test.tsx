import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Statistic, StatisticLabel, StatisticValue } from './Statistic';

describe('Statistic', () => {
  it('renders the value and label', () => {
    render(
      <Statistic>
        <StatisticValue>WXYZ</StatisticValue>
        <StatisticLabel>Lobby Code</StatisticLabel>
      </Statistic>,
    );

    expect(screen.getByText('WXYZ')).toBeInTheDocument();
    expect(screen.getByText('Lobby Code')).toBeInTheDocument();
  });

  it('sets serif typography on the value and the field-label class on the label', () => {
    render(
      <Statistic>
        <StatisticValue>01:30</StatisticValue>
        <StatisticLabel>Time Left</StatisticLabel>
      </Statistic>,
    );

    expect(screen.getByText('01:30').className).toContain('font-display');
    expect(screen.getByText('Time Left').className).toContain('field-label');
  });

  it('forwards ref to the container', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Statistic ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('DIV');
  });
});
