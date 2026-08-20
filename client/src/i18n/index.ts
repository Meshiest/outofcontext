import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resources, { en } from './resources';
import { buildPseudoResources } from './pseudo';
import { LANGUAGES } from './languages';

// A pseudo-locale generated from `en` at load, reachable via `?lng=en-XA`. It accents and
// pads every string so a QA pass can spot hardcoded copy (stays un-accented) and layouts that break
// under longer translations. Generating it at runtime keeps it in sync with `en` for free.
const resourcesWithPseudo = {
  ...resources,
  'en-XA': buildPseudoResources(en as unknown as Parameters<typeof buildPseudoResources>[0]),
};

/** Namespaces bundled with the app. Game namespaces are eager for now. */
const ns = [
  'common',
  'errors',
  'home',
  'lobby',
  'settings',
  'notFound',
  'gameList',
  'game-common',
  'game-story',
  'game-comic',
  'game-draw',
  'game-redacted',
  'game-recipe',
  'game-assassin',
];

i18n.use(LanguageDetector).use(initReactI18next);

void i18n.init({
  resources: resourcesWithPseudo,
  ns,
  defaultNS: 'common',
  fallbackLng: 'en',
  // en-XA is a QA-only pseudo-locale, not an offered language; everything else falls back to en. A
  // language missing from this list silently resolves to en and looks like it simply has no
  // translations, so LANGUAGES is the single place a new one gets added.
  supportedLngs: [...LANGUAGES, 'en-XA'],
  nonExplicitSupportedLngs: true,
  interpolation: {
    // React already escapes; do not double-escape interpolated values.
    escapeValue: false,
  },
  detection: {
    order: ['querystring', 'localStorage', 'navigator'],
    lookupQuerystring: 'lng',
    lookupLocalStorage: 'oocLang',
    caches: ['localStorage'],
  },
});

// Reflect the active language on <html> for a11y and light RTL readiness, and retitle the tab.
//
// index.html carries an English <title> for the pre-hydration paint and for crawlers, so without
// this the tab keeps saying "Out of Context!" in every language while the page itself is
// translated. The og: tags stay English by design: they describe a link to outofcontext.party,
// which is one shared address rather than a per-reader view. (Fires on init too.)
i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('lang', lng);
  document.documentElement.setAttribute('dir', i18n.dir(lng));
  document.title = i18n.t('common:app.pageTitle');
});

export default i18n;
