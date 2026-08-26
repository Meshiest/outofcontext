/**
 * Cross-cutting flow: the GAMES CATALOGUE page layout.
 *
 * The desktop split layout (catalogue rail + detail panel) is a full-viewport-height row whose two
 * columns scroll independently, so the page itself must never scroll. Regression guard: the drawn
 * scrollbar thumb used to overshoot its track by the track's 2px inset at max scroll, and because the
 * track and every ancestor up to the document have visible overflow, that 2px protrusion added a
 * stray page-wide scrollbar the moment you scrolled the catalogue to the bottom.
 *
 * Desktop only: the mobile stacked layout scrolls the whole page by design, so this asserts nothing
 * there.
 */
import { test, expect } from '@playwright/test';

test('scrolling the catalogue rail to the bottom does not add a page scrollbar', async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width < 1024, 'desktop split layout only');

  await page.goto('/games');
  await expect(page.getByTestId('game-list-split')).toBeVisible();

  // The bug only exists while the rail actually overflows: the drawn thumb appears exactly then, so
  // wait for it. This also outlasts font loading, which is what grows the catalogue past one screen.
  const railThumb = page.locator('[data-testid="game-list-split"] aside .ooc-scroll-thumb');
  await expect(railThumb).toBeVisible();

  // How many pixels the document can scroll; <= 0 means no page scrollbar.
  const pageOverflow = () =>
    page.evaluate(() => {
      const de = document.documentElement;
      return de.scrollHeight - de.clientHeight;
    });

  expect(await pageOverflow()).toBeLessThanOrEqual(0);

  // Drive the catalogue rail's real scroller (the drawn scrollbar hides the native one) to the end,
  // then confirm it actually moved so a no-op scroll can never pass this test silently.
  const scrolled = await page.evaluate(() => {
    const vp = document.querySelector(
      '[data-testid="game-list-split"] aside .ooc-scroll-viewport',
    ) as HTMLElement | null;
    if (!vp) return 0;
    vp.scrollTop = vp.scrollHeight;
    return vp.scrollTop;
  });
  expect(scrolled).toBeGreaterThan(0);

  // Repositioning the drawn thumb is async (scroll -> React re-render), so the overflow the bug adds
  // appears a tick AFTER the scroll. Wait for the thumb to actually reach the end of its track before
  // measuring - otherwise a one-shot check races the transient pre-render state where nothing has
  // moved yet and the page has not yet overflowed.
  await page.waitForFunction(() => {
    const t = document.querySelector('[data-testid="game-list-split"] aside .ooc-scroll-thumb');
    const k = document.querySelector('[data-testid="game-list-split"] aside .ooc-scroll-track');
    if (!t || !k) return false;
    return k.getBoundingClientRect().bottom - t.getBoundingClientRect().bottom < 6;
  });

  expect(await pageOverflow()).toBeLessThanOrEqual(0);
});
