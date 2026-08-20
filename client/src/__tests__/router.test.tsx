import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router';

// The pages carry heavy provider/hook dependencies and have their own tests; here we only verify the
// route table wires each path to the right page, so we stub the pages with lightweight markers.
vi.mock('@/pages/HomePage', () => ({ HomePage: () => <div data-testid="home" /> }));
vi.mock('@/pages/GameListPage', () => ({ GameListPage: () => <div data-testid="games" /> }));
vi.mock('@/pages/NotFoundPage', () => ({ NotFoundPage: () => <div data-testid="notfound" /> }));
vi.mock('@/pages/lobby/LobbyPage', () => ({
  LobbyPage: () => {
    const { code } = useParams();
    return <div data-testid="lobby" data-code={code ?? ''} />;
  },
}));

import { AppRoutes } from '@/router';

afterEach(cleanup);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('AppRoutes', () => {
  it('renders HomePage at /', () => {
    renderAt('/');
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('renders GameListPage at /games', () => {
    renderAt('/games');
    expect(screen.getByTestId('games')).toBeInTheDocument();
    expect(screen.queryByTestId('lobby')).toBeNull();
  });

  it('renders LobbyPage at /lobby/:code and exposes the code param', () => {
    renderAt('/lobby/ABCD');
    const lobby = screen.getByTestId('lobby');
    expect(lobby).toBeInTheDocument();
    expect(lobby).toHaveAttribute('data-code', 'ABCD');
  });

  it('renders NotFoundPage for a bare code segment (lobbies are under /lobby)', () => {
    renderAt('/ABCD');
    expect(screen.getByTestId('notfound')).toBeInTheDocument();
    expect(screen.queryByTestId('lobby')).toBeNull();
  });

  it('renders NotFoundPage for an unmatched multi-segment path', () => {
    renderAt('/no/such/page');
    expect(screen.getByTestId('notfound')).toBeInTheDocument();
  });
});
