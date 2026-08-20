import { useTranslation } from 'react-i18next';
import { Divider } from '@/components/ui/Divider/Divider';
import { Header, HeaderSubheader } from '@/components/ui/Header/Header';
import { Icon } from '@/components/ui/Icon/Icon';
import { RecipeLineForm } from './RecipeLineForm';

export interface RecipeCommentEditorProps {
  /** Comments other reviewers have already written for this recipe. */
  existingComments: string[];
  /** Final link of the chain -> "Finish" instead of "Sign". */
  isLastLink: boolean;
  onSubmit: (comment: string) => void;
}

/**
 * EDITING - leave a reviewer comment on a recipe. Shows the comments other reviewers have already
 * written, separated by "And" dividers.
 */
export function RecipeCommentEditor({
  existingComments,
  isLastLink,
  onSubmit,
}: RecipeCommentEditorProps) {
  const { t } = useTranslation('game-recipe');
  return (
    <div className="my-4">
      <Header as="h4" icon={<Icon name="chat" />}>
        {t('commentHeader')}
      </Header>
      {existingComments.length > 0 && (
        <div className="mt-2">
          <div className="text-base text-text-muted">{t('commentExisting')}</div>
          <div className="mt-2">
            {existingComments.map((comment, i) => (
              <div key={i}>
                {i !== 0 && <Divider>{t('and')}</Divider>}
                <HeaderSubheader>{comment}</HeaderSubheader>
              </div>
            ))}
          </div>
        </div>
      )}
      <RecipeLineForm label={t('commentLabel')} isLastLink={isLastLink} onSubmit={onSubmit} />
    </div>
  );
}
