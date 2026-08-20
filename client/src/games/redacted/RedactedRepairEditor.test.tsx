import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RedactedRepairEditor } from './RedactedRepairEditor';
import type { RedactedCensorLink, RedactedTruncateLink } from './redactedUtils';

const censorLink: RedactedCensorLink = {
  type: 'tamper',
  kind: 'censor',
  data: {
    line: [
      { type: 'string', value: 'The ' },
      { type: 'count', index: 1, key: 0, value: 5 },
      { type: 'string', value: ' quick ' },
      { type: 'count', index: 3, key: 1, value: 4 },
      { type: 'string', value: '.' },
    ],
    indexes: [1, 3],
  },
};

const truncateLink: RedactedTruncateLink = {
  type: 'tamper',
  kind: 'truncate',
  data: { line: 'The quick brown', length: 10, count: 2 },
};

describe('RedactedRepairEditor (censor)', () => {
  it('renders one input per censored gap and disables submit until all are valid', async () => {
    const onSubmitCensor = vi.fn();
    const user = userEvent.setup();
    render(
      <RedactedRepairEditor
        link={censorLink}
        onSubmitCensor={onSubmitCensor}
        onSubmitTruncate={vi.fn()}
      />,
    );

    const submit = screen.getByRole('button', { name: 'Repair' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Word 1'), 'lazy');
    await user.type(screen.getByLabelText('Word 2'), 'fox');
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onSubmitCensor).toHaveBeenCalledWith([
      [1, 'lazy'],
      [3, 'fox'],
    ]);
  });

  it('rejects a gap containing more than one word', async () => {
    const user = userEvent.setup();
    render(
      <RedactedRepairEditor
        link={censorLink}
        onSubmitCensor={vi.fn()}
        onSubmitTruncate={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Word 1'), 'two words');
    await user.type(screen.getByLabelText('Word 2'), 'ok');
    expect(screen.getByText('Too many words!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repair' })).toBeDisabled();
  });
});

describe('RedactedRepairEditor (truncate)', () => {
  it('enables submit only for 1-256 chars of replacement text', async () => {
    const onSubmitTruncate = vi.fn();
    const user = userEvent.setup();
    render(
      <RedactedRepairEditor
        link={truncateLink}
        onSubmitCensor={vi.fn()}
        onSubmitTruncate={onSubmitTruncate}
      />,
    );

    const submit = screen.getByRole('button', { name: 'Repair' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText('Replacement'), 'fox jumped over');
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onSubmitTruncate).toHaveBeenCalledWith('fox jumped over');
  });

  it('shows the gap number inside the bar until a word is typed', () => {
    const { container } = render(
      <RedactedRepairEditor
        link={censorLink}
        onSubmitCensor={vi.fn()}
        onSubmitTruncate={vi.fn()}
      />,
    );
    const bars = container.querySelectorAll('.redacted');
    // The label lives IN the bar rather than beside it as a superscript footnote.
    expect(bars[0]).toHaveTextContent('1');
    expect(container.querySelector('sup')).toBeNull();
  });

  it('replaces the bar contents with the word as it is typed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RedactedRepairEditor
        link={censorLink}
        onSubmitCensor={vi.fn()}
        onSubmitTruncate={vi.fn()}
      />,
    );
    await user.type(screen.getByLabelText(/Word 1/), 'banana');

    const bar = container.querySelectorAll('.redacted')[0];
    // The guess fills the gap it belongs to, so the player reads their sentence back in place
    // instead of matching numbered fields to numbered blanks by eye.
    expect(bar).toHaveTextContent('banana');
    // ...and the number is gone, since there is nothing left to cross-reference.
    expect(bar.textContent).not.toContain('1');
  });

  it('sets the line in the same face inside the bar as outside it', () => {
    const { container } = render(
      <RedactedRepairEditor
        link={censorLink}
        onSubmitCensor={vi.fn()}
        onSubmitTruncate={vi.fn()}
      />,
    );
    // <code> would force monospace, making a filled-in guess look pasted in from another document.
    expect(container.querySelector('code')).toBeNull();
    expect(container.querySelector('.story-body')).toBeInTheDocument();
  });

  it('fills the truncated tail as the replacement is typed', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RedactedRepairEditor
        link={truncateLink}
        onSubmitCensor={vi.fn()}
        onSubmitTruncate={vi.fn()}
      />,
    );
    const bar = container.querySelector('.redacted')!;
    expect(bar).toHaveTextContent('');

    await user.type(screen.getByLabelText(/Replacement/i), 'ran away');

    // Same live preview as the censor gaps, through the same component.
    expect(bar).toHaveTextContent('ran away');
    expect(container.querySelector('code')).toBeNull();
  });
});
