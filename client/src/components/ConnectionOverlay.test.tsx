import '@/i18n';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => ({
  connection: { everConnected: true, connected: false, disconnected: false, kicked: false },
}));

vi.mock('@/contexts/LobbyContext', () => ({ useConnection: () => h.connection }));

import { ConnectionOverlay } from './ConnectionOverlay';

afterEach(() => {
  cleanup();
  h.connection = { everConnected: true, connected: false, disconnected: false, kicked: false };
});

describe('ConnectionOverlay', () => {
  // Not a dead end: a member reaped while its stream was already closed never receives the kick, so
  // the spinner alone would be a screen that can never resolve.
  it('offers a reconnect alongside the spinner while disconnected', async () => {
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload } as Location);
    h.connection = { everConnected: true, connected: false, disconnected: true, kicked: false };

    render(<ConnectionOverlay />);
    expect(screen.getAllByText('Lost connection to server').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'Reconnect' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  // Being reaped is terminal - the server has dropped the member, so reconnecting produces a
  // session with no lobby. Without a way out the player just watches the reconnect spinner.
  it('offers a reload once the server says it kicked us', async () => {
    const reload = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload } as Location);
    h.connection = { everConnected: true, connected: false, disconnected: true, kicked: true };

    render(<ConnectionOverlay />);
    expect(screen.getByText(/disconnected for being away/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when connected', () => {
    const { container } = render(<ConnectionOverlay />);
    expect(container).toBeEmptyDOMElement();
  });
});
