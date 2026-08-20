import '@/i18n';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

// PageWrapper mounts the real SettingsPanel (preferences + sounds). Stub it so this page can be
// verified in isolation.
vi.mock('@/components/widgets/SettingsPanel', () => ({
  SettingsPanel: () => <div data-testid="settings-panel" />,
}));

// gameInfo has no hidden games today, so inject a fixture of the six real games plus one hidden
// decoy to deterministically exercise the hidden-filter.
vi.mock('@gameInfo', () => {
  const make = (title: string, hidden = false) => ({
    title,
    subtitle: 'subtitle',
    difficulty: 'Simple',
    description: `${title} description`,
    more: 'more info',
    howTo: ['step one'],
    playTime: '5m',
    hidden,
    config: {
      players: {
        name: 'Max Players',
        text: 'Players',
        info: 'info',
        type: 'int',
        min: 2,
        max: 256,
        defaults: '#numPlayers',
      },
    },
  });
  return {
    default: {
      story: make('Raconteur'),
      comic: make('Dilettante'),
      draw: make('Scribble'),
      redacted: make('Redacted'),
      recipe: make('Hodgepodge'),
      assassin: make('Wurderer'),
      // No shipped game is hidden; this exists so the filter itself stays covered.
      hiddenGame: make('Hidden Game', true),
    },
  };
});

import { GameListPage } from './GameListPage';

const VISIBLE_TITLES = [
  'Raconteur',
  'Dilettante',
  'Scribble',
  'Redacted',
  'Hodgepodge',
  'Wurderer',
];

function renderPage() {
  return render(
    <MemoryRouter>
      <GameListPage />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

// Both layouts render; CSS shows one. Scope assertions so each is checked on its own terms.
const stacked = () => screen.getByTestId('game-list-stacked');
const split = () => screen.getByTestId('game-list-split');

describe('GameListPage', () => {
  it('stacks a card for every non-hidden game on small screens', () => {
    renderPage();
    const region = stacked();
    expect(region.querySelectorAll('[data-game]')).toHaveLength(VISIBLE_TITLES.length);
    for (const title of VISIBLE_TITLES) {
      expect(within(region).getByText(title)).toBeInTheDocument();
    }
  });

  it('lists every non-hidden game in the desktop catalogue rail', () => {
    renderPage();
    const region = split();
    expect(region.querySelectorAll('[data-game-card]')).toHaveLength(VISIBLE_TITLES.length);
    for (const title of VISIBLE_TITLES) {
      expect(within(region).getByRole('button', { name: new RegExp(title) })).toBeInTheDocument();
    }
  });

  it('opens the first game in the detail panel by default', () => {
    renderPage();
    const region = split();
    expect(region.querySelector('[data-game-detail="story"]')).not.toBeNull();
    // The three accordion sections are opened out into panes, all readable at once.
    const detail = within(region.querySelector('[data-game-detail]') as HTMLElement);
    expect(detail.getByText('More Info')).toBeInTheDocument();
    expect(detail.getByText('How to Play')).toBeInTheDocument();
    expect(detail.getByText('Configurations')).toBeInTheDocument();
  });

  it('swaps the detail panel to the clicked game', async () => {
    const user = userEvent.setup();
    renderPage();
    const region = split();

    await user.click(within(region).getByRole('button', { name: /Scribble/ }));

    expect(region.querySelector('[data-game-detail="draw"]')).not.toBeNull();
    expect(region.querySelector('[data-game-detail="story"]')).toBeNull();
    expect(within(region).getByRole('button', { name: /Scribble/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('does not render hidden games in either layout', () => {
    // Asserted on the game key rather than the title: copy comes from the locale now, so a game
    // with no locale namespace renders a blank title either way and the title check proves nothing.
    const { container } = renderPage();
    expect(container.querySelector('[data-game="hiddenGame"]')).toBeNull();
    expect(container.querySelector('[data-game-card="hiddenGame"]')).toBeNull();
    expect(container.querySelector('[data-game-detail="hiddenGame"]')).toBeNull();
  });

  it('renders a Home link that points to / in both layouts', () => {
    renderPage();
    for (const region of [stacked(), split()]) {
      expect(within(region).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    }
  });
});
