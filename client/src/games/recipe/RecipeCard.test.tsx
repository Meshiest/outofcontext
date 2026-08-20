import '@/i18n';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RecipeCard } from './RecipeCard';
import type { CompiledRecipe } from './types';

const nameTable = { p1: 'Ada', p2: 'Bram', p3: 'Cleo' };

const recipe: CompiledRecipe = {
  theme: 'Midnight Tacos',
  author: 'p1',
  steps: [
    { link: 'Chop the rubber duck finely.', editors: ['p1', 'p2'] },
    { link: 'Simmer with a traffic cone.', editors: ['p2', 'p3'] },
  ],
  comments: [
    { link: 'Delicious!', editor: 'p3' },
    { link: 'Needs salt.', editor: '' },
  ],
};

describe('RecipeCard', () => {
  it('renders the theme and its author', () => {
    render(<RecipeCard recipe={recipe} nameTable={nameTable} />);
    expect(screen.getByText('Midnight Tacos')).toBeInTheDocument();
    expect(screen.getByText(/by Ada/)).toBeInTheDocument();
  });

  it('renders numbered steps with dual-author attribution', () => {
    render(<RecipeCard recipe={recipe} nameTable={nameTable} />);
    expect(screen.getByText('Chop the rubber duck finely.')).toBeInTheDocument();
    expect(screen.getByText('Simmer with a traffic cone.')).toBeInTheDocument();
    expect(screen.getByText(/Step 1/)).toBeInTheDocument();
    expect(screen.getByText(/Step 2/)).toBeInTheDocument();
    expect(screen.getByText('Ada & Bram')).toBeInTheDocument();
    expect(screen.getByText('Bram & Cleo')).toBeInTheDocument();
  });

  it('renders comments with commenter names, falling back to Anonymous', () => {
    render(<RecipeCard recipe={recipe} nameTable={nameTable} />);
    expect(screen.getByText('Delicious!')).toBeInTheDocument();
    expect(screen.getByText('Cleo')).toBeInTheDocument();
    expect(screen.getByText('Needs salt.')).toBeInTheDocument();
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('omits author attribution when the recipe is anonymous', () => {
    const anon: CompiledRecipe = {
      theme: 'Secret Stew',
      author: '',
      steps: [{ link: 'Boil the ITEM.', editors: ['', ''] }],
      comments: [],
    };
    render(<RecipeCard recipe={anon} nameTable={nameTable} />);
    expect(screen.getByText('Secret Stew')).toBeInTheDocument();
    expect(screen.queryByText(/^by /)).toBeNull();
  });
});
