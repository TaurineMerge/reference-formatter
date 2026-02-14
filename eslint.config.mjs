import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default defineConfig([
  { ignores: ['dist', 'node_modules', 'docs', '.next', 'build'] },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ...config.languageOptions,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  })),
  {
    files: ['**/*.{tsx,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  eslintConfigPrettier,
]);
