// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Button } from './Button';

afterEach(cleanup);

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Create Lobby</Button>);
    expect(screen.getByRole('button').textContent).toContain('Create Lobby');
  });

  it('fires onClick when pressed', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    fireEvent.click(button);
    expect(button.disabled).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows a spinner and disables while loading', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Button loading onClick={onClick}>
        Creating
      </Button>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(container.querySelector('.btn-dots')).not.toBeNull();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a mapped icon by name', () => {
    const { container } = render(<Button icon="check">Done</Button>);
    const icon = container.querySelector('i.fa-solid');
    expect(icon).not.toBeNull();
    expect(icon?.className).toContain('fa-check');
  });

  it('forwards ref to the underlying <button>', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('defaults to type="button"', () => {
    render(<Button>Safe</Button>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });
});

describe('Button / icon-only centering', () => {
  // letter-spacing is added after EVERY character including the last, so on an icon-only button it
  // pads 0.1em to the right of the glyph. The element box stays centred (the space is inside it),
  // which is why this is invisible to getBoundingClientRect and only shows up as ink sitting left
  // of centre - most obvious on the round ones, where the eye has a circle to compare against.
  it('does not inherit the label letter-spacing', () => {
    render(<Button iconButton icon="plus" aria-label="Add" />);
    const button = screen.getByRole('button', { name: 'Add' });
    expect(button).toHaveClass('tracking-normal');
    expect(button.className).not.toMatch(/tracking-\[0\.1em\]/);
  });

  it('keeps the letter-spacing on a labelled button', () => {
    render(<Button icon="plus">Add a line</Button>);
    const button = screen.getByRole('button', { name: 'Add a line' });
    expect(button.className).toMatch(/tracking-\[0\.1em\]/);
    expect(button).not.toHaveClass('tracking-normal');
  });
});
