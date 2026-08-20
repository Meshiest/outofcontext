import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DoneReadingButton } from './DoneReadingButton';

describe('DoneReadingButton', () => {
  it('shows "Done Reading" while not done and fires onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<DoneReadingButton isDone={false} onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Done Reading' });
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows "Still Reading" once done', () => {
    render(<DoneReadingButton isDone onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Still Reading' })).toBeInTheDocument();
  });
});
