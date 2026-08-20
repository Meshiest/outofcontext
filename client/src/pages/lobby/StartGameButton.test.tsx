import '@/i18n';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { StartGameButton } from './StartGameButton';

afterEach(cleanup);

describe('StartGameButton', () => {
  it('emits start when enabled and clicked', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<StartGameButton disabled={false} onStart={onStart} />);
    await user.click(screen.getByRole('button', { name: 'Start Game' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('is disabled and does not emit when config is invalid', async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<StartGameButton disabled onStart={onStart} />);
    const button = screen.getByRole('button', { name: 'Start Game' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onStart).not.toHaveBeenCalled();
  });
});
