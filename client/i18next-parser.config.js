// i18next-parser: extract t() keys from source into locales/en/*.
export default {
  locales: ['en'],
  defaultNamespace: 'common',
  // Stories are excluded, and not merely because they are dev-only. One story file holds several
  // components and so declares several useTranslation() calls; the parser cannot tell which `t`
  // belongs to which scope, so every bare t('foo') in one is filed under defaultNamespace. That
  // reports `common:join.codeLabel` as missing when the key exists in home and resolves correctly
  // at runtime - a false positive whose message points at the wrong file. App components declare
  // one useTranslation each, so they are unaffected. Storybook is the check for stories: an
  // unresolved key renders as the raw key the moment you open one.
  input: ['src/**/*.{ts,tsx}', '!src/**/*.stories.tsx'],
  output: 'src/locales/$LOCALE/$NAMESPACE.json',
  keySeparator: '.',
  namespaceSeparator: ':',
  sort: true,
  keepRemoved: true,
  createOldCatalogs: false,
};
