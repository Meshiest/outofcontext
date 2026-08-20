import type { Resource } from 'i18next';

import common from '../locales/en/common.json';
import errors from '../locales/en/errors.json';
import home from '../locales/en/home.json';
import lobby from '../locales/en/lobby.json';
import settings from '../locales/en/settings.json';
import notFound from '../locales/en/notFound.json';
import gameList from '../locales/en/gameList.json';
import gameCommon from '../locales/en/game-common.json';
import gameStory from '../locales/en/game-story.json';
import gameComic from '../locales/en/game-comic.json';
import gameDraw from '../locales/en/game-draw.json';
import gameRedacted from '../locales/en/game-redacted.json';
import gameRecipe from '../locales/en/game-recipe.json';
import gameAssassin from '../locales/en/game-assassin.json';

/**
 * Statically-typed source-of-truth for the `en` locale.
 *
 * The runtime resource tree (default export) is built from a Vite glob so new locales/namespaces
 * register with no code change, but a glob is typed with a uniform index signature and cannot give
 * per-namespace key types. These static imports do, so `t()` keys are typechecked via
 * `types/i18next.d.ts` (which binds `resources: typeof en`).
 */
export const en = {
  common,
  errors,
  home,
  lobby,
  settings,
  notFound,
  gameList,
  'game-common': gameCommon,
  'game-story': gameStory,
  'game-comic': gameComic,
  'game-draw': gameDraw,
  'game-redacted': gameRedacted,
  'game-recipe': gameRecipe,
  'game-assassin': gameAssassin,
} as const;

/**
 * Runtime resource tree for i18next: { [lang]: { [namespace]: messages } }.
 * The glob picks up every locale/namespace JSON, so adding an `es/`, `fr/`, ... folder or a new
 * namespace file needs no change here.
 */
const modules = import.meta.glob('../locales/*/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;

const resources: Resource = {};
for (const filePath in modules) {
  const match = /\/locales\/([^/]+)\/([^/]+)\.json$/.exec(filePath);
  if (!match) continue;
  const [, lang, namespace] = match;
  (resources[lang] ??= {})[namespace] = modules[filePath].default;
}

export default resources;
