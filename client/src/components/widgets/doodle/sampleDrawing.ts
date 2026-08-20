import { DRAWING_CANVAS_SIZE, type DrawingImage } from '@shared/drawing';

const INK = ['#14120f', '#d93425', '#24a8b8', '#3f8f3a'];

/**
 * A small hand-drawn face for stories and manual QA, rendered on demand rather than checked in as a
 * large base64 literal. Returns an empty string where there is no 2D context (SSR, or a jsdom stub).
 *
 * `variant` shifts the ink colour and the mouth curve so a story showing several drawings at once
 * gets visibly different ones rather than the same face repeated.
 */
export function makeSampleDrawing(variant = 0): DrawingImage {
  const canvas = document.createElement('canvas');
  canvas.width = DRAWING_CANVAS_SIZE;
  canvas.height = DRAWING_CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  // A frown at variant 1, a straight line at 2, a grin otherwise.
  const mouthDip = [660, 470, 560, 690][variant % 4];

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, DRAWING_CANVAS_SIZE, DRAWING_CANVAS_SIZE);
  ctx.strokeStyle = INK[variant % INK.length];
  ctx.lineWidth = 24;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // The face's ink spans roughly y=220..660, so drawn at its natural coordinates it sits about 70px
  // high on a 1024 canvas and reads as off-centre once a viewer frames it. Nudge it down instead of
  // moving every point.
  ctx.save();
  ctx.translate(0, 62);

  ctx.beginPath();
  ctx.arc(512, 440, 220, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  // Vertical eyes. Slanted strokes read as a squint or a wink rather than as eyes.
  ctx.moveTo(415, 395);
  ctx.lineTo(415, 435);
  ctx.moveTo(609, 395);
  ctx.lineTo(609, 435);
  ctx.moveTo(390, 560);
  ctx.quadraticCurveTo(512, mouthDip, 634, 560);
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL('image/png');
}
