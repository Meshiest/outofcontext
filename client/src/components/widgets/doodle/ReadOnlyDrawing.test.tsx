import '@/test/canvasMock';
import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReadOnlyDrawing } from './ReadOnlyDrawing';

const IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

describe('ReadOnlyDrawing', () => {
  it('renders the drawing as an image element sized to its container', () => {
    render(<ReadOnlyDrawing image={IMAGE} />);
    expect(screen.getByRole('presentation')).toHaveAttribute('src', IMAGE);
  });

  it('renders a blank frame when there is no drawing', () => {
    render(<ReadOnlyDrawing />);
    expect(screen.queryByRole('presentation')).toBeNull();
  });

  it('shows the author attribution when given one', () => {
    render(<ReadOnlyDrawing image={IMAGE} author="Ada" />);
    expect(screen.getByText('Drawn by Ada')).toBeInTheDocument();
  });
});
