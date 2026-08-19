import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

/**
 * Flat config (ESLint 9+/10), equivalente ao antigo `.eslintrc.json`
 * (que usava `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`
 * separadamente). O pacote combinado `typescript-eslint` substitui os dois
 * pacotes legados e já expõe configs prontas em formato flat.
 */
export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'prisma/migrations/**', 'src/generated/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
