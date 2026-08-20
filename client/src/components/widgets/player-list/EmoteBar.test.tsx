import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { EmoteBar, EMOTE_MAP } from './EmoteBar';

describe('EmoteBar', () => {
  it('renders all 16 emote buttons when open', () => {
    render(<EmoteBar isOpen onSendEmote={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(EMOTE_MAP.length);
  });

  it('calls onSendEmote with the emote name', async () => {
    const user = userEvent.setup();
    const onSendEmote = vi.fn();
    render(<EmoteBar isOpen onSendEmote={onSendEmote} />);
    await user.click(screen.getByRole('button', { name: 'smile' }));
    expect(onSendEmote).toHaveBeenCalledWith('smile');
  });

  it('hides the emotes when not open', () => {
    render(<EmoteBar isOpen={false} onSendEmote={() => {}} />);
    expect(screen.queryByRole('button', { name: 'smile' })).not.toBeInTheDocument();
  });
});
