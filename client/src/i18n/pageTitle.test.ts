import '@/i18n';
import { afterEach, describe, it, expect } from 'vitest';
import i18n from '@/i18n';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

/**
 * index.html ships an English <title> for the pre-hydration paint, so the tab only follows the
 * chosen language if something rewrites it. That "something" is the languageChanged handler, and
 * nothing else in the app touches document.title - so if it regresses, the page translates while
 * the tab silently does not.
 */
describe('document title', () => {
  it('follows the active language', async () => {
    await i18n.changeLanguage('de');
    expect(document.title).toBe(i18n.getFixedT('de', 'common')('app.pageTitle'));

    await i18n.changeLanguage('fr');
    expect(document.title).toBe(i18n.getFixedT('fr', 'common')('app.pageTitle'));
  });

  it('is a different string per language, not one hardcoded name', async () => {
    const titles = new Set<string>();
    for (const lng of ['en', 'de', 'es', 'fr']) {
      await i18n.changeLanguage(lng);
      titles.add(document.title);
    }
    expect(titles.size).toBe(4);
  });
});
