import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResultsViewer } from './ResultsViewer';

describe('ResultsViewer', () => {
  it('renders the title and its children', () => {
    render(
      <ResultsViewer title="Stories">
        <p>A finished story</p>
      </ResultsViewer>,
    );
    expect(screen.getByText('Stories')).toBeInTheDocument();
    expect(screen.getByText('A finished story')).toBeInTheDocument();
  });

  it('shows a loading spinner when there are no children', () => {
    render(<ResultsViewer title="Stories">{null}</ResultsViewer>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows the loading spinner for an empty children array', () => {
    render(<ResultsViewer title="Chains">{[]}</ResultsViewer>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
