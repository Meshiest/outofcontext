import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

// Mock the preferences/sounds modules so these widgets are verified in isolation against the
// shared contract.
const mocks = vi.hoisted(() => ({
  setDarkMode: vi.fn(),
  setStreamerMode: vi.fn(),
  setTurnSound: vi.fn(),
  setName: vi.fn(),
  play: vi.fn(),
  prefs: { darkMode: false, streamerMode: false, turnSound: '', name: '' },
}));

vi.mock('@/contexts/PreferencesContext', () => ({
  usePreferences: () => ({
    darkMode: mocks.prefs.darkMode,
    setDarkMode: mocks.setDarkMode,
    streamerMode: mocks.prefs.streamerMode,
    setStreamerMode: mocks.setStreamerMode,
    turnSound: mocks.prefs.turnSound,
    setTurnSound: mocks.setTurnSound,
    name: mocks.prefs.name,
    setName: mocks.setName,
  }),
}));

vi.mock('@/data/sounds', () => ({
  // Mirrors the real contract: no "none" entry (Settings prepends it); labels are i18n keys.
  TURN_SOUNDS: [
    { value: 'bit', label: 'settings:turnSound.options.bit' },
    { value: 'chime', label: 'settings:turnSound.options.chime' },
  ],
  useTurnSound: () => mocks.play,
}));

import { SettingsPanel } from './SettingsPanel';

beforeEach(() => {
  mocks.prefs = { darkMode: false, streamerMode: false, turnSound: '', name: '' };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SettingsPanel', () => {
  it('starts collapsed and expands when the header is clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    const header = screen.getByRole('button', { name: 'User Preferences' });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    await user.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('checkbox', { name: 'Enabled' })).toBeInTheDocument();
  });

  it('calls setDarkMode when the dark-mode checkbox is toggled', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    await user.click(screen.getByRole('button', { name: 'User Preferences' }));
    await user.click(screen.getByRole('checkbox', { name: 'Enabled' }));
    expect(mocks.setDarkMode).toHaveBeenCalledWith(true);
  });

  it('calls setStreamerMode when the hide-lobby checkbox is toggled', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    await user.click(screen.getByRole('button', { name: 'User Preferences' }));
    await user.click(screen.getByRole('checkbox', { name: 'Hidden' }));
    expect(mocks.setStreamerMode).toHaveBeenCalledWith(true);
  });

  it('calls setTurnSound when a sound is selected', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    await user.click(screen.getByRole('button', { name: 'User Preferences' }));
    await user.click(screen.getByRole('combobox', { name: 'Turn notification sound' }));
    await user.click(screen.getByRole('option', { name: 'Bit' }));
    expect(mocks.setTurnSound).toHaveBeenCalledWith('bit');
  });

  it('offers a None option that clears the sound', async () => {
    mocks.prefs.turnSound = 'bit';
    const user = userEvent.setup();
    render(<SettingsPanel />);
    await user.click(screen.getByRole('button', { name: 'User Preferences' }));
    await user.click(screen.getByRole('combobox', { name: 'Turn notification sound' }));
    await user.click(screen.getByRole('option', { name: 'None' }));
    expect(mocks.setTurnSound).toHaveBeenCalledWith('');
  });

  it('disables the preview button when no sound is selected', async () => {
    const user = userEvent.setup();
    render(<SettingsPanel />);
    await user.click(screen.getByRole('button', { name: 'User Preferences' }));
    expect(screen.getByRole('button', { name: 'Play sound preview' })).toBeDisabled();
  });

  it('enables the preview button and plays the selected sound', async () => {
    mocks.prefs.turnSound = 'bit';
    const user = userEvent.setup();
    render(<SettingsPanel />);
    await user.click(screen.getByRole('button', { name: 'User Preferences' }));
    const preview = screen.getByRole('button', { name: 'Play sound preview' });
    expect(preview).toBeEnabled();
    await user.click(preview);
    expect(mocks.play).toHaveBeenCalledWith('bit');
  });
});
