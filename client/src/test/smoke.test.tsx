import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { GameId } from '@shared/types';

function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}

describe('Smoke test', () => {
  it('renders a React component', () => {
    render(<Greeting name="Out Of Context" />);
    expect(screen.getByText('Hello, Out Of Context')).toBeInTheDocument();
  });

  it('resolves shared types via the @shared alias', () => {
    const game: GameId = 'story';
    expect(game).toBe('story');
  });
});
