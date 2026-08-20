import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RedactedTamperEditor } from './RedactedTamperEditor';

const line = 'alpha beta gamma delta';

describe('RedactedTamperEditor', () => {
  it('auto-selects censor and hides the toggle when only censor is enabled', () => {
    render(
      <RedactedTamperEditor
        line={line}
        ink={100}
        gamemode={{ censor: 'player', truncate: 'none' }}
        onCensor={vi.fn()}
        onTruncate={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Truncate' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Censor' })).toBeNull();
    // the submit reflects censor mode
    expect(screen.getByRole('button', { name: 'Censor Story' })).toBeInTheDocument();
  });

  it('auto-selects truncate and hides the toggle when only truncate is enabled', () => {
    render(
      <RedactedTamperEditor
        line={line}
        ink={100}
        gamemode={{ censor: 'none', truncate: 'player' }}
        onCensor={vi.fn()}
        onTruncate={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Censor' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Truncate Story' })).toBeInTheDocument();
  });

  it('shows the toggle when both modes are enabled and switches mode', async () => {
    const user = userEvent.setup();
    render(
      <RedactedTamperEditor
        line={line}
        ink={100}
        gamemode={{ censor: 'player', truncate: 'player' }}
        onCensor={vi.fn()}
        onTruncate={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Truncate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Censor' })).toBeInTheDocument();
    // defaults to truncate mode
    expect(screen.getByRole('button', { name: 'Truncate Story' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Censor' }));
    expect(screen.getByRole('button', { name: 'Censor Story' })).toBeInTheDocument();
  });
});
