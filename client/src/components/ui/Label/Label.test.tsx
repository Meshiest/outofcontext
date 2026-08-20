// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Label } from './Label';

afterEach(cleanup);

describe('Label', () => {
  it('renders its children', () => {
    render(<Label>Admin</Label>);
    expect(screen.getByText('Admin')).not.toBeNull();
  });

  it('applies the color class', () => {
    render(<Label color="positive">Ready</Label>);
    expect(screen.getByText('Ready').className).toContain('text-positive');
  });

  it('renders an icon when provided', () => {
    const { container } = render(<Label icon="shield">Admin</Label>);
    expect(container.querySelector('i.fa-solid')).not.toBeNull();
  });

  it('positions itself when attached', () => {
    render(
      <Label attached="top right" color="primary">
        Host
      </Label>,
    );
    expect(screen.getByText('Host').className).toContain('absolute');
  });
});
