import { useTranslation } from 'react-i18next';
import { CardHeader, CardMeta } from '@/components/ui/Card/Card';
import type { CompiledRecipe } from './types';

export interface RecipeCardProps {
  /** A fully compiled recipe (theme, numbered steps, comments). */
  recipe: CompiledRecipe;
  /** playerId -> display name for author attribution. */
  nameTable: Record<string, string>;
}

/**
 * Renders a single compiled recipe inside a results ChainCard. Each step credits both of its
 * `editors`: the step writer and the ingredient contributor.
 */
export function RecipeCard({ recipe, nameTable }: RecipeCardProps) {
  const { t } = useTranslation('game-recipe');
  const nameOf = (id: string) => nameTable[id] ?? id;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <CardHeader>{recipe.theme}</CardHeader>
        {recipe.author && <CardMeta>{t('by', { name: nameOf(recipe.author) })}</CardMeta>}
      </div>

      <ol className="flex flex-col gap-3">
        {recipe.steps.map((step, i) => (
          <li key={i}>
            <div className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
              {t('cardStepNumber', { number: i + 1 })}
            </div>
            <p className="font-display text-lg leading-snug text-text">{step.link}</p>
            {step.editors[0] && (
              <div className="text-right text-sm text-text-muted">
                {t('cardStepAuthors', {
                  writer: nameOf(step.editors[0]),
                  helper: nameOf(step.editors[1]),
                })}
              </div>
            )}
          </li>
        ))}
      </ol>

      {recipe.comments.length > 0 && (
        <div className="flex flex-col gap-2">
          {recipe.comments.map((comment, i) => (
            <div key={i}>
              <div className="text-sm font-semibold text-text">
                {nameTable[comment.editor] || t('anonymous')}
              </div>
              <div className="text-text">{comment.link}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
