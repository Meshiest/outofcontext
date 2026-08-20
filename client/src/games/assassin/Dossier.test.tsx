import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Dossier } from './Dossier';

describe('Dossier', () => {
  it('renders the target name and all kill words in single mode', () => {
    render(
      <Dossier
        title="crimson wolf"
        target={{ name: 'Alice', words: ['banana', 'trombone', 'velvet'] }}
        battleRoyale={false}
      />,
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    for (const word of ['banana', 'trombone', 'velvet']) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
    // Operation codename is game data - rendered verbatim.
    expect(screen.getByText('crimson wolf')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('renders a table row for every target in battle royale mode', () => {
    render(
      <Dossier
        title="cobalt fox"
        targets={[
          { name: 'Bob', words: ['apple', 'kite'] },
          { name: 'Carol', words: ['ladder'] },
          { name: 'Dave', words: ['pillow', 'quartz'] },
          { name: 'Erin', words: ['zephyr'] },
        ]}
        battleRoyale
      />,
    );

    for (const name of ['Bob', 'Carol', 'Dave', 'Erin']) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    for (const word of ['apple', 'kite', 'ladder', 'pillow', 'quartz', 'zephyr']) {
      expect(screen.getByText(word)).toBeInTheDocument();
    }
    // One header row + four target rows.
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });
});
