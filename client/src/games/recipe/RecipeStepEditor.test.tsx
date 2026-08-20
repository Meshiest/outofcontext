import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RecipeStepEditor } from './RecipeStepEditor';

function setup(overrides: Partial<Parameters<typeof RecipeStepEditor>[0]> = {}) {
  const onSubmit = vi.fn();
  render(
    <RecipeStepEditor
      theme="Tacos"
      stepIndex={1}
      totalSteps={3}
      isLastLink={false}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onSubmit };
}

describe('RecipeStepEditor', () => {
  it('disables submit and shows the requirement when ITEM is missing', async () => {
    setup();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), 'Chop the onion');

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/'ITEM' must be in the instruction/i)).toBeInTheDocument();
  });

  it('enables submit and calls onSubmit once ITEM is present', async () => {
    const { onSubmit } = setup();
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), 'Add the ITEM to the pot');

    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    await user.click(button);
    expect(onSubmit).toHaveBeenCalledWith('Add the ITEM to the pot');
  });

  it('disables submit for empty input and caps length at 256', () => {
    setup();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '256');
  });

  it('shows "Finish" on the last link instead of "Sign"', () => {
    setup({ isLastLink: true });
    expect(screen.getByRole('button')).toHaveTextContent(/finish/i);
  });
});
