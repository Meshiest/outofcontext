import type { PlayerState } from '@shared/types';

/**
 * The four EDITING link shapes a Recipe player can receive, discriminated by `type`. Mirrors the
 * `link` produced by `Recipe.getPlayerState` in core/games/recipe.ts. `theme` is the first link of a
 * step chain (no theme yet); `step` extends a themed chain; `ingredient` / `comment` are their own
 * chains. `{ type: null }` is the server's fallback and renders nothing editable.
 */
export interface RecipeThemeLink {
  type: 'theme';
}

export interface RecipeStepLink {
  type: 'step';
  /** The theme this step is written for. */
  theme: string;
  /** 1-based index of the step being written. */
  index: number;
  /** Total steps per recipe. */
  total: number;
}

export interface RecipeIngredientLink {
  type: 'ingredient';
  /** Ingredients other players have already added to this recipe. */
  ingredients: string[];
}

export interface RecipeCommentLink {
  type: 'comment';
  /** Comments other reviewers have already written for this recipe. */
  comments: string[];
}

export interface RecipeNullLink {
  type: null;
}

export type RecipeLink =
  RecipeThemeLink | RecipeStepLink | RecipeIngredientLink | RecipeCommentLink | RecipeNullLink;

/**
 * Recipe-specific extension of the base `{ id, state }` player state. Which fields are present
 * depends on `state` (see `Recipe.getPlayerState`): EDITING carries `link` (+ `isLastLink` when the
 * server sets it); READING / WAITING carry `liked`. All optional so one type covers every phase.
 */
export interface RecipePlayerState extends PlayerState {
  /** EDITING: the context-dependent editing link (theme / step / ingredient / comment). */
  link?: RecipeLink;
  /** EDITING: true when the current link is the final one of its chain. */
  isLastLink?: boolean;
  /** READING / WAITING: reaction id -> whether this player left it on chain[i]. */
  reacted?: Record<string, boolean[]>;
}

/**
 * One compiled step of a recipe: the instruction with ITEM placeholders already resolved, plus the
 * two contributors - `[step writer, ingredient contributor]`. Both are `''` when the game is
 * anonymous. Mirrors the `steps` entries from `Recipe.compileRecipes()`.
 */
export interface RecipeStepEntry {
  link: string;
  editors: [string, string];
}

/** One compiled comment: the resolved text plus its author playerId (`''` when anonymous). */
export interface RecipeCommentEntry {
  link: string;
  editor: string;
}

/**
 * A fully compiled recipe - the shape of each entry in the `recipe:result` payload
 * (`CompiledRecipe[]`), produced by `Recipe.compileRecipes()` in core/games/recipe.ts.
 */
export interface CompiledRecipe {
  theme: string;
  /** Theme author playerId, or `''` when anonymous. */
  author: string;
  steps: RecipeStepEntry[];
  comments: RecipeCommentEntry[];
}
