/**
 * Shared lobby layout constants.
 *
 * `LOBBY_COLUMN` is the single column width every stacked lobby section uses on small screens - the
 * game info / config content, the members table, and the User Preferences panel - so they all line
 * up at the same width instead of each carrying its own max-width. On `lg` the columns override it:
 * the members rail becomes a fixed-width side rail and the content column takes the rest.
 */
export const LOBBY_COLUMN = 'w-full max-w-[360px]';

/**
 * Desktop cap for the game/content column - a reading measure, nothing more.
 *
 * Deliberately NOT derived from viewport height. Tying the column's WIDTH to the window's HEIGHT
 * collapsed it on a short window: at ~700px tall the cap worked out to a couple of hundred pixels
 * and prose wrapped a word per line. Only the drawing canvas actually cares about height, and it
 * carries its own cap (with a floor); when the window is too short for it, the page scrolls, which
 * is the right trade - text should never be squeezed to keep a canvas on screen.
 */
export const GAME_COLUMN_DESKTOP = 'lg:max-w-[760px]';

/**
 * Horizontal inset for everything stacked in the desktop members rail.
 *
 * The rail's scrolling section needs padding of its own: an overflow container clips on BOTH axes,
 * so without it the tables' ambient shadow is shaved off at the edge, and the right side has to
 * clear the drawn scrollbar rather than sit under it. The catch is that the padding narrows the
 * scrolled content relative to its unscrolled siblings - the progress bar spanned the full rail
 * while the player list sat inset within it, which reads as a misalignment because it is one.
 *
 * Applying the same inset to those siblings puts every edge on one line. Shared as a constant so
 * the two cannot drift apart again.
 */
export const RAIL_INSET = 'lg:pl-2 lg:pr-6';
