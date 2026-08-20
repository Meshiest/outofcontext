import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import { Card, CardContent, CardHeader, CardMeta, CardDescription, CardExtra } from './Card';

describe('Card', () => {
  it('renders children inside the outer container', () => {
    render(
      <Card data-testid="card">
        <span>inner</span>
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveTextContent('inner');
  });

  it('renders the full compound structure', () => {
    render(
      <Card>
        <CardContent>
          <CardHeader>Raconteur</CardHeader>
          <CardMeta>Subtitle</CardMeta>
          <CardDescription>Body text</CardDescription>
        </CardContent>
      </Card>,
    );
    expect(screen.getByText('Raconteur')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });

  it('applies extra styling when CardContent has extra', () => {
    render(
      <CardContent extra data-testid="extra">
        footer
      </CardContent>,
    );
    const el = screen.getByTestId('extra');
    expect(el.className).toContain('border-t');
    expect(el.className).toContain('bg-surface-2');
  });

  it('CardExtra is equivalent to CardContent with extra', () => {
    render(<CardExtra data-testid="shorthand">footer</CardExtra>);
    const el = screen.getByTestId('shorthand');
    expect(el.className).toContain('border-t');
    expect(el.className).toContain('bg-surface-2');
  });

  it('merges a custom className onto the outer container', () => {
    render(<Card className="custom-card" data-testid="card" />);
    expect(screen.getByTestId('card').className).toContain('custom-card');
  });

  it('forwards a ref to the outer div', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
