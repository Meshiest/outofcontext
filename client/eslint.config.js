import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import i18next from 'eslint-plugin-i18next';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  // No hardcoded user-facing copy in components: visible JSX text must go through t()/<Trans>.
  // jsx-text-only ignores attributes (className, aria-*, etc.) and non-JSX string literals.
  {
    files: ['src/**/*.tsx'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': ['error', { mode: 'jsx-text-only' }],
    },
  },
  // Stories and tests may use literal demo text and export non-component values.
  {
    files: ['**/*.stories.tsx', '**/*.test.{ts,tsx}', 'src/test/**'],
    rules: {
      'i18next/no-literal-string': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
  prettier,
);
