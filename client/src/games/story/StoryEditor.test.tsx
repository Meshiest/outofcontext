import '@/i18n';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { StoryEditor } from './StoryEditor';

describe('StoryEditor', () => {
  it('shows the first-line prompt when there is no context', () => {
    render(<StoryEditor link={[]} isLastLink={false} onSubmit={vi.fn()} />);
    expect(screen.getByText('Write the first line')).toBeInTheDocument();
  });

  it('renders context lines separated by "Then" dividers', () => {
    render(<StoryEditor link={['first', 'second']} isLastLink={false} onSubmit={vi.fn()} />);
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.getByText('Then')).toBeInTheDocument();
  });

  it('rejects empty input: submit is disabled and onSubmit does not fire', () => {
    const onSubmit = vi.fn();
    render(<StoryEditor link={[]} isLastLink={false} onSubmit={onSubmit} />);
    const button = screen.getByRole('button', { name: 'Sign' });
    expect(button).toBeDisabled();
    fireEvent.submit(button.closest('form')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects input longer than 512 characters', () => {
    const onSubmit = vi.fn();
    render(<StoryEditor link={[]} isLastLink={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a'.repeat(513) } });
    const button = screen.getByRole('button', { name: 'Sign' });
    expect(button).toBeDisabled();
    fireEvent.submit(button.closest('form')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed text and clears the field for a valid line', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<StoryEditor link={[]} isLastLink={false} onSubmit={onSubmit} />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    await user.type(textarea, '  A quiet beginning.  ');
    const button = screen.getByRole('button', { name: 'Sign' });
    expect(button).toBeEnabled();
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledWith('A quiet beginning.');
    expect(textarea.value).toBe('');
  });

  it('shows a "Finish" submit on the last link', () => {
    render(<StoryEditor link={['prior line']} isLastLink onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument();
  });
});
