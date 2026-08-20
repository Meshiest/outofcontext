import { useTranslation } from 'react-i18next';
import { Header } from '@/components/ui/Header/Header';
import { Icon } from '@/components/ui/Icon/Icon';
import { Doodle } from '@/components/widgets/doodle/Doodle';
import type { DrawingImage } from '@shared/drawing';

export interface DrawEditorProps {
  /** The description the player must illustrate. */
  description: string;
  /** Client-only countdown length in seconds; forwarded to the Doodle timer. 0/undefined disables it. */
  timeLimit?: number;
  /** Show the colour palette + stroke slider. */
  colors: boolean;
  onSubmit: (image: DrawingImage) => void;
}

/**
 * Drawing canvas for the "draw this description" half of a chain. The description is shown in the
 * editorial serif above the Doodle. The timer is purely client-side (it does not submit or advance
 * the round on the server) -- expiring just locks the canvas while leaving Done available.
 */
export function DrawEditor({ description, timeLimit, colors, onSubmit }: DrawEditorProps) {
  const { t } = useTranslation('game-draw');
  return (
    <div className="flex flex-col gap-3">
      {/* Centred: the prompt and the thing being prompted are the focus of the turn and sit directly
          above a centred square canvas, so left-aligning them left the pair hanging off the side of
          the composition. `justify-center` is needed as well as `text-center` because the icon makes
          Header a flex row. */}
      <Header as="h4" icon={<Icon name="paint brush" />} className="justify-center text-center">
        {t('draw.instruction')}
      </Header>
      <p className="story-body px-1 text-center">{description}</p>
      <Doodle colors={colors} timer={timeLimit} onSave={onSubmit} />
    </div>
  );
}
