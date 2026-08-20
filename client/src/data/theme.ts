/**
 * Out Of Context - non-CSS design data (OOC THEME v1).
 * Colour tokens live in ../index.css (`@theme`); this file is for what CSS cannot hold.
 */

/**
 * In-canvas drawing swatches (Doodle). Most must read on a white canvas; `#ffffff` is deliberately
 * included as a paint-over/eraser colour and the tan is there for skin/paper tones.
 *
 * Sixteen entries, laid out 8x2 on mobile and 2x8 beside the canvas on desktop - so the count
 * should stay a multiple of both. Ordered as a neutral ramp (black -> white) followed by hues
 * running warm to cool, with the two greens adjacent as a light/dark pair.
 */
export const DRAWING_PALETTE = [
  '#14120f',
  '#4a4a4a',
  '#8a8a8a',
  '#c4c4c4',
  '#ffffff',
  '#e11d0f',
  '#f5811f',
  '#f5d90a',
  '#14a02e',
  '#3ad160',
  '#12a8b8',
  '#2438e0',
  '#8a2fd6',
  '#e8399b',
  '#8b5a2b',
  '#d9bd8f',
] as const;
