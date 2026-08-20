import { useTranslation } from 'react-i18next';
import { Header, HeaderSubheader } from '@/components/ui/Header/Header';
import { RecipeLineForm } from './RecipeLineForm';

export interface RecipeThemeEditorProps {
  onSubmit: (theme: string) => void;
}

/**
 * EDITING - the first link of a step chain: name the dish / theme that the recipe's instructions
 * will riff on. The theme is never the last link, so the submit is always the primary "Sign".
 */
export function RecipeThemeEditor({ onSubmit }: RecipeThemeEditorProps) {
  const { t } = useTranslation('game-recipe');
  return (
    <div className="my-4">
      <Header as="h4" icon={<i className="fa-solid fa-lightbulb" aria-hidden="true" />}>
        {t('themeHeader')}
      </Header>
      <HeaderSubheader>{t('themeSubheader')}</HeaderSubheader>
      <RecipeLineForm label={t('themeLabel')} isLastLink={false} onSubmit={onSubmit} />
    </div>
  );
}
