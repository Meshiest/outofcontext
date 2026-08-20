// Icon name -> Font Awesome solid glyph class.
//
// We render Font Awesome via the webfont (an <i class="fa-solid fa-..."> element) so the
// identity's debossed icon treatment (a lighter tint of the fill + a dual light/dark
// text-shadow) works. Add new glyphs here as screens need them.
export const ICON_MAP = {
  pencil: 'fa-pencil',
  'paint brush': 'fa-paintbrush',
  clock: 'fa-clock',
  check: 'fa-check',
  times: 'fa-xmark',
  shield: 'fa-shield-halved',
  user: 'fa-user',
  users: 'fa-users',
  fire: 'fa-fire',
  dropdown: 'fa-chevron-down',
  undo: 'fa-rotate-left',
  redo: 'fa-rotate-right',
  'play circle': 'fa-circle-play',
  circle: 'fa-circle',
  // The only outline circle Font Awesome ships is in the regular face, so this entry carries its
  // own style class (Icon defaults to solid otherwise).
  'circle outline': 'fa-regular fa-circle',
  play: 'fa-play',
  heart: 'fa-heart',
  'face laugh squint': 'fa-face-laugh-squint',
  skull: 'fa-skull',
  brain: 'fa-brain',
  bug: 'fa-bug',
  'hand rock': 'fa-hand-back-fist',
  'hand paper': 'fa-hand',
  'hand scissors': 'fa-hand-scissors',
  question: 'fa-circle-question',
  exclamation: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
  wait: 'fa-hourglass-half',
  write: 'fa-pen',
  'thumbs up': 'fa-thumbs-up',
  'thumbs down': 'fa-thumbs-down',
  smile: 'fa-face-smile',
  meh: 'fa-face-meh',
  frown: 'fa-face-frown',
  chat: 'fa-comment',
  eraser: 'fa-eraser',
  cut: 'fa-scissors',
  // Action + chrome glyphs the identity uses.
  plus: 'fa-plus',
  copy: 'fa-copy',
  'arrow right': 'fa-arrow-right',
  'arrow down': 'fa-arrow-down',
  'arrow left': 'fa-arrow-left',
  bolt: 'fa-bolt',
  'sign out': 'fa-right-from-bracket',
  'user slash': 'fa-user-slash',
  'book open': 'fa-book-open',
  'eye slash': 'fa-eye-slash',
  eye: 'fa-eye',
  crown: 'fa-crown',
  share: 'fa-share-nodes',
  gear: 'fa-gear',
  moon: 'fa-moon',
  sun: 'fa-sun',
  trash: 'fa-trash',
} satisfies Record<string, string>;

/** Union of every known icon name. */
export type IconName = keyof typeof ICON_MAP;

/** All known icon names, for docs/story grids. */
export const ICON_NAMES = Object.keys(ICON_MAP) as IconName[];
