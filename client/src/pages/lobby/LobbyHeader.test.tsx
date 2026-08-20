import '@/i18n';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prefs: { streamerMode: false },
  writeText: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/contexts/PreferencesContext', () => ({
  usePreferences: () => mocks.prefs,
}));

import { LobbyHeader } from './LobbyHeader';

beforeEach(() => {
  mocks.prefs = { streamerMode: false };
  mocks.writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mocks.writeText },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('LobbyHeader', () => {
  it('shows the code uppercased (keycaps) with its phonetic spelling', () => {
    render(<LobbyHeader code="wxyz" />);
    // The code renders as per-character keycap cells; the whole code is exposed via aria-label.
    expect(screen.getByLabelText('WXYZ')).toBeInTheDocument();
    expect(screen.getByText('whiskey - xray - yankee - zulu')).toBeInTheDocument();
  });

  it('copies the code and a share link to the clipboard', async () => {
    // Use fireEvent (not userEvent) so userEvent's own clipboard stub does not shadow the mock.
    render(<LobbyHeader code="wxyz" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy Code' }));
    await waitFor(() => expect(mocks.writeText).toHaveBeenCalledWith('WXYZ'));

    fireEvent.click(screen.getByRole('button', { name: 'Share Link' }));
    await waitFor(() =>
      expect(mocks.writeText).toHaveBeenCalledWith(expect.stringContaining('/wxyz')),
    );
  });

  it('renders nothing in streamer mode', () => {
    mocks.prefs = { streamerMode: true };
    const { container } = render(<LobbyHeader code="wxyz" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('WXYZ')).not.toBeInTheDocument();
  });
});
