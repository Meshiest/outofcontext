import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/ui/Header/Header';
import { Icon } from '@/components/ui/Icon/Icon';
import { Divider } from '@/components/ui/Divider/Divider';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Card } from '@/components/ui/Card/Card';
import { Doodle } from '@/components/widgets/doodle/Doodle';
import type { DrawingImage } from '@shared/drawing';
import type { ComicLink } from './types';

export interface ComicEditorProps {
  /** Previous entries (the last `contextLen` links). Empty for the first drawing of a chain. */
  link: ComicLink[];
  /** True when this is the final link of the chain. */
  isLastLink: boolean;
  /** Whether captions are collected this game (drives the caption input + guard). */
  enableCaptions: boolean;
  /** Whether the previous entries' captions are shown as context. */
  showCaptions: boolean;
  /** Whether the previous entries' drawings are shown as context. */
  showDrawings: boolean;
  /** Continuous (collaborative single-drawing) mode. */
  continuous: boolean;
  /** Enable the colour palette + stroke slider on the canvas. */
  colors: boolean;
  /** Called with the finished drawing + caption when the player presses Done. */
  onSubmit: (data: { drawing: DrawingImage; caption: string }) => void;
}

/**
 * The EDITING interface for Dilettante. Shows the prior artists' context (read-only drawings and/or
 * captions per the mode flags, or a "draw the beginning" prompt), an optional 1-256 char caption
 * field when captions are enabled, and the drawing canvas whose Done button submits.
 */
export function ComicEditor({
  link,
  isLastLink,
  enableCaptions,
  showCaptions,
  showDrawings,
  continuous,
  colors,
  onSubmit,
}: ComicEditorProps) {
  const { t } = useTranslation('game-comic');
  const [caption, setCaption] = useState('');

  const captionInvalid = enableCaptions && (caption.length < 1 || caption.length > 256);

  const verb = showCaptions && !showDrawings ? t('verbWrote') : t('verbDrew');
  let prefix = '';
  if (isLastLink) prefix = t('finishPrefix');
  else if (continuous && link.length > 0) prefix = t('continuePrefix');

  const handleSubmit = (drawing: DrawingImage) => {
    if (enableCaptions && (caption.length < 1 || caption.length > 256)) return;
    onSubmit({ drawing, caption });
    setCaption('');
  };

  // In continuous mode the previous drawing and this one are meant to read as a single composition,
  // so they are rendered together in one frame that butts them edge to edge instead of as separate
  // cards with a gap between them.
  const joinDrawings = continuous && showDrawings && link.length > 0;

  return (
    <div className="my-4">
      {link.length === 0 ? (
        <Header as="h4" icon={<Icon name="paint brush" />}>
          {t('drawBeginning')}
        </Header>
      ) : (
        <>
          <Header as="h4" icon={<Icon name="paint brush" />}>
            {t('lastArtists', { count: link.length, prefix, verb })}
          </Header>
          {!joinDrawings && (
            <div className="mt-2.5 flex flex-col gap-2">
              {link.map((entry, i) => (
                <div key={i}>
                  {i !== 0 && <Divider>{t('then')}</Divider>}
                  {showCaptions && <p className="story-body mb-2 text-text">{entry.caption}</p>}
                  {showDrawings && (
                    <Card className="overflow-hidden">
                      <Doodle readOnly image={entry.drawing} />
                    </Card>
                  )}
                </div>
              ))}
            </div>
          )}
          {joinDrawings && showCaptions && (
            <div className="mt-2.5 flex flex-col gap-2">
              {link.map((entry, i) => (
                <p key={i} className="story-body text-text">
                  {entry.caption}
                </p>
              ))}
            </div>
          )}
        </>
      )}

      {!continuous && link.length > 0 && (
        // Generous top margin: this heading separates the previous artist's card from the blank
        // canvas below, so it needs to read as a break rather than a caption on the card above it.
        <Header as="h4" icon={<Icon name="paint brush" />} className="mt-6">
          {t('continueStory')}
        </Header>
      )}

      {/* The instruction belongs with the prompt at the top, not under the canvas where it is only
          read after the drawing is already done. */}
      {!isLastLink && continuous && (
        <p className="mt-1 text-sm text-text-muted">{t('connectBottom')}</p>
      )}

      <form onSubmit={(event) => event.preventDefault()} className="mt-4 flex flex-col gap-2">
        {enableCaptions && (
          <Textarea
            label={t('captionLabel')}
            rows={2}
            maxLength={256}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
        )}
        {joinDrawings ? (
          // One Doodle carrying BOTH drawings: the previous one renders above the canvas inside the
          // same card. That keeps the card's surface gradient running unbroken across the pair
          // (rendering them as two cards left a visible seam where one gradient ended and the next
          // began), lines them up without reserving a gutter to match the tools column, and lets a
          // stroke start on the drawing above and carry down into this one.
          <Doodle
            above={link.map((entry, i) => (
              <Doodle key={i} readOnly image={entry.drawing} />
            ))}
            onSave={handleSubmit}
            disabled={captionInvalid}
            colors={colors}
          />
        ) : (
          <Doodle onSave={handleSubmit} disabled={captionInvalid} colors={colors} />
        )}
      </form>
    </div>
  );
}
