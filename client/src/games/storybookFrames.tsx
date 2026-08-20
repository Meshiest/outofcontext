import type { Decorator } from '@storybook/react-vite';

/**
 * Storybook frames that reproduce the column a game actually renders in.
 *
 * Without these, every game story renders full-bleed across the Storybook canvas and the
 * documentation lies: prose runs to a measure the app never gives it, drawings scale to a size no
 * player sees, and word grids wrap in places they never wrap in a real lobby.
 *
 * Where the numbers come from - client/src/pages/lobby/layout.ts, read alongside LobbyWaiting.tsx
 * and LobbyPlaying.tsx, which are the only two screens that mount a game:
 *
 * - Mobile (375px frame, 343px of content). The lobby page is `px-4`, and below `lg` the game sits
 *   in LOBBY_COLUMN (`w-full max-w-[360px]`). On a 375px-wide phone the cap never binds, so the
 *   game gets 375 - 16 - 16 = 343px. The frame is the whole 375px device column with the page's own
 *   `px-4` gutter inside it, so what you measure on screen is the 343px the player measures.
 *
 * - Desktop (760px). From `lg` up the game column is `lg:flex-1` capped by GAME_COLUMN_DESKTOP
 *   (`lg:max-w-[760px]`), sitting beside the `lg:w-80` members rail with a `lg:gap-8` between them.
 *   Any window past roughly 1144px (320 rail + 32 gap + 760 game + 32 page gutter) hands the game
 *   exactly 760px, which is what nearly every desktop player gets - the cap, not the window, is the
 *   binding constraint.
 *
 * - Desktop rail (288px). Only GameProgress needs this one: on desktop it moves out of the game
 *   column and into the members rail, which is `lg:w-80` (320px) less RAIL_INSET
 *   (`lg:pl-2 lg:pr-6`, 32px) = 288px.
 *
 * Two things worth knowing before using them:
 *
 * - The frames nest safely. A story-level mobile frame inside a meta-level desktop frame still
 *   lands at 375px, because the inner cap is the smaller of the two - so a file can frame every
 *   story at the desktop measure from `meta` and override single stories to mobile.
 *
 * - They constrain WIDTH, not the breakpoint. Tailwind's `sm:` / `lg:` variants key off the
 *   viewport, so a component with `lg:` classes keeps its desktop behaviour inside a mobile frame.
 *   Use the toolbar viewport control when the breakpoint itself is what you want to see; these
 *   frames are about measure, which is what the stories were getting wrong.
 */
const frame = (className: string): Decorator =>
  function GameColumnFrame(Story) {
    return (
      <div className={className}>
        <Story />
      </div>
    );
  };

/** The game column on a 375px phone: 343px of content once the page's `px-4` is taken off. */
export const mobileGameColumn = frame('mx-auto w-full max-w-[375px] px-4');

/** The game column on any desktop wide enough to hit the GAME_COLUMN_DESKTOP cap: 760px. */
export const desktopGameColumn = frame('mx-auto w-full max-w-[760px]');

/** The desktop members rail, where GameProgress lives from `lg` up: 288px inside RAIL_INSET. */
export const desktopRail = frame('mx-auto w-full max-w-[288px]');
