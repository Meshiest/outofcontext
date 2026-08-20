// i18next-parser: extract t() keys from source into locales/en/*.
export default {
  locales: ['en'],
  defaultNamespace: 'common',
  input: ['src/**/*.{ts,tsx}'],
  output: 'src/locales/$LOCALE/$NAMESPACE.json',
  keySeparator: '.',
  namespaceSeparator: ':',
  sort: true,
  keepRemoved: true,
  createOldCatalogs: false,
};
