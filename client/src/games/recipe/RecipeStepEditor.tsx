import { useTranslation } from 'react-i18next';
import { Header, HeaderSubheader } from '@/components/ui/Header/Header';
import { Icon } from '@/components/ui/Icon/Icon';
import { RecipeLineForm } from './RecipeLineForm';

export interface RecipeStepEditorProps {
  /** The theme this instruction is written for. */
  theme: string;
  /** 1-based index of the step being written. */
  stepIndex: number;
  /** Total steps per recipe. */
  totalSteps: number;
  /** Final link of the chain -> "Finish" instead of "Sign". */
  isLastLink: boolean;
  onSubmit: (step: string) => void;
}

/**
 * EDITING - write one instruction for a themed recipe. The instruction MUST contain the literal
 * token ITEM (case-sensitive), which the server later swaps for a random ingredient; while it is
 * missing the field shows a requirement and the submit stays disabled.
 */
export function RecipeStepEditor({
  theme,
  stepIndex,
  totalSteps,
  isLastLink,
  onSubmit,
}: RecipeStepEditorProps) {
  const { t } = useTranslation('game-recipe');
  return (
    <div className="my-4">
      <Header as="h4" icon={<Icon name="pencil" />}>
        {t('stepHeader', { theme })}
      </Header>
      <HeaderSubheader>{t('stepNumber', { index: stepIndex, total: totalSteps })}</HeaderSubheader>
      <RecipeLineForm
        label={t('stepLabel', { index: stepIndex })}
        isLastLink={isLastLink}
        onSubmit={onSubmit}
        validate={(line) => (line.includes('ITEM') ? null : t('stepItemRequired'))}
        helper={t('stepItemHelper')}
      />
    </div>
  );
}
