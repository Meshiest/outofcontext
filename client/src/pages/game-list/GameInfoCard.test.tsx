import '@/i18n';
import { afterEach, describe, it, expect } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GameMeta } from '@shared/types';
import GAMES from '@gameInfo';
import story from '@/locales/en/game-story.json';
import assassin from '@/locales/en/game-assassin.json';
import { GameInfoCard } from './GameInfoCard';

afterEach(cleanup);

/** The collapsible panel a given accordion header controls. */
function panelFor(header: HTMLElement): HTMLElement {
  const id = header.getAttribute('aria-controls');
  const panel = id ? document.getElementById(id) : null;
  if (!panel) throw new Error('no panel for header ' + header.textContent);
  return panel;
}

// The card takes only a game key and its shape; all copy is read from that game's locale namespace,
// so the expectations here are the real `en` strings rather than fixture text.
const storyMeta = GAMES.story as GameMeta;

describe('GameInfoCard', () => {
  it('renders the title and description from the locale', () => {
    render(<GameInfoCard gameKey="story" meta={storyMeta} />);
    expect(screen.getByText(story.title)).toBeInTheDocument();
    expect(screen.getByText(story.description)).toBeInTheDocument();
  });

  it('starts with the accordion sections collapsed and opens one on click', async () => {
    const user = userEvent.setup();
    render(<GameInfoCard gameKey="story" meta={storyMeta} />);

    const moreInfoButton = screen.getByRole('button', { name: 'More Info' });
    expect(moreInfoButton).toHaveAttribute('aria-expanded', 'false');
    // A collapsed panel stays in the DOM so it can animate closed, and is collapsed by CSS
    // (grid-template-rows), which jsdom does not compute. `inert` is the assertable part of the
    // closed state - it is what takes the panel out of the tab order and the a11y tree.
    const panel = panelFor(moreInfoButton);
    expect(panel).toHaveAttribute('inert');

    await user.click(moreInfoButton);

    expect(moreInfoButton).toHaveAttribute('aria-expanded', 'true');
    expect(panel).not.toHaveAttribute('inert');
    expect(within(panel).getByText(story.more)).toBeInTheDocument();
  });

  it('renders How to Play as an ordered list of steps', async () => {
    const user = userEvent.setup();
    render(<GameInfoCard gameKey="story" meta={storyMeta} />);

    const button = screen.getByRole('button', { name: 'How to Play' });
    await user.click(button);
    // Every panel is in the DOM regardless of open state, so scope to this one rather than the whole
    // card (the Configurations panel holds a list too).
    const panel = within(panelFor(button));
    const list = panel.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(panel.getAllByRole('listitem')).toHaveLength(story.howTo.length);
    expect(panel.getByText(story.howTo[0])).toBeInTheDocument();
  });

  it('renders each config as a bold name plus its info text', async () => {
    const user = userEvent.setup();
    render(<GameInfoCard gameKey="story" meta={storyMeta} />);

    await user.click(screen.getByRole('button', { name: 'Configurations' }));
    const label = screen.getByText(story.config.players.name);
    expect(label.tagName).toBe('B');
    expect(screen.getByText(new RegExp(story.config.players.info))).toBeInTheDocument();
  });

  it('shows play time, difficulty, and the "min+" player range when max is 256', () => {
    render(<GameInfoCard gameKey="story" meta={storyMeta} />);
    expect(screen.getByText(story.playTime)).toBeInTheDocument();
    expect(screen.getByText(story.difficulty)).toBeInTheDocument();
    expect(screen.getByText('2+')).toBeInTheDocument();
  });

  it('shows a "min-max" player range when max is not the 256 sentinel', () => {
    const meta: GameMeta = {
      config: { players: { type: 'int', min: 3, max: 7, defaults: 5 } },
    };
    render(<GameInfoCard gameKey="assassin" meta={meta} />);
    expect(screen.getByText('3-7')).toBeInTheDocument();
    // Copy still comes from the key, not the passed-in shape.
    expect(screen.getByText(assassin.playTime)).toBeInTheDocument();
    expect(screen.getByText(assassin.difficulty)).toBeInTheDocument();
  });
});
