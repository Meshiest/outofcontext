import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AdminControls } from './AdminControls';

describe('AdminControls', () => {
  it('shows the Remove button in remove mode and fires the callback', async () => {
    const user = userEvent.setup();
    const onRemovePlayer = vi.fn();
    render(<AdminControls playerId="u1" isRemoveMode onRemovePlayer={onRemovePlayer} />);
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemovePlayer).toHaveBeenCalledWith('u1');
  });

  it('shows the Change button in admin mode and fires the callback', async () => {
    const user = userEvent.setup();
    const onGrantAdmin = vi.fn();
    render(<AdminControls playerId="u1" isAdminMode onGrantAdmin={onGrantAdmin} />);
    await user.click(screen.getByRole('button', { name: 'Change' }));
    expect(onGrantAdmin).toHaveBeenCalledWith('u1');
  });

  it('renders nothing when no mode is active', () => {
    render(<AdminControls playerId="u1" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
