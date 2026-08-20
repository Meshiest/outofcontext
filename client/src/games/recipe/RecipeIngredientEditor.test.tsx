import '@/i18n';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RecipeIngredientEditor } from './RecipeIngredientEditor';

describe('RecipeIngredientEditor', () => {
  it('warns (without disabling) when the input contains ITEM', async () => {
    render(
      <RecipeIngredientEditor existingIngredients={[]} isLastLink={false} onSubmit={vi.fn()} />,
    );
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), 'a giant ITEM');

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('does not warn for a normal ingredient and submits it', async () => {
    const onSubmit = vi.fn();
    render(
      <RecipeIngredientEditor existingIngredients={[]} isLastLink={false} onSubmit={onSubmit} />,
    );
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), 'a rubber duck');

    expect(screen.queryByText(/are you sure/i)).toBeNull();
    await user.click(screen.getByRole('button'));
    expect(onSubmit).toHaveBeenCalledWith('a rubber duck');
  });

  it('lists the ingredients other players have already added', () => {
    render(
      <RecipeIngredientEditor
        existingIngredients={['salt', 'pepper']}
        isLastLink={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('salt')).toBeInTheDocument();
    expect(screen.getByText('pepper')).toBeInTheDocument();
  });
});
