import { useTranslation } from 'react-i18next';
import { Divider } from '@/components/ui/Divider/Divider';
import { Header, HeaderSubheader } from '@/components/ui/Header/Header';
import { RecipeLineForm } from './RecipeLineForm';

export interface RecipeIngredientEditorProps {
  /** Ingredients other players have already added to this recipe. */
  existingIngredients: string[];
  /** Final link of the chain -> "Finish" instead of "Sign". */
  isLastLink: boolean;
  onSubmit: (ingredient: string) => void;
}

/**
 * EDITING - add an ingredient (an object or thing) that will later replace an ITEM token in a random
 * step. Shows the ingredients already contributed, separated by "And" dividers, and nudges the
 * player if they typed the literal ITEM token here (which usually is not intended).
 */
export function RecipeIngredientEditor({
  existingIngredients,
  isLastLink,
  onSubmit,
}: RecipeIngredientEditorProps) {
  const { t } = useTranslation('game-recipe');
  return (
    <div className="my-4">
      <Header as="h4" icon={<i className="fa-solid fa-basket-shopping" aria-hidden="true" />}>
        {t('ingredientHeader')}
      </Header>
      {existingIngredients.length > 0 && (
        <div className="mt-2">
          <div className="text-base text-text-muted">{t('ingredientExisting')}</div>
          <div className="mt-2">
            {existingIngredients.map((ingredient, i) => (
              <div key={i}>
                {i !== 0 && <Divider>{t('and')}</Divider>}
                <HeaderSubheader>{ingredient}</HeaderSubheader>
              </div>
            ))}
          </div>
        </div>
      )}
      <RecipeLineForm
        label={t('ingredientLabel')}
        isLastLink={isLastLink}
        onSubmit={onSubmit}
        helper={t('ingredientHelper')}
        warn={(line) => (line.includes('ITEM') ? t('ingredientItemWarning') : null)}
      />
    </div>
  );
}
