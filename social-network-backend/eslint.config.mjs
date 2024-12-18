import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginJest from 'eslint-plugin-jest';
import pluginPrettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' }
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        jest: true,
        expect: true,
        describe: true,
        beforeEach: true,
        it: true
      }
    }
  },
  pluginJs.configs.recommended,
  {
    plugins: {
      jest: pluginJest,
      prettier: pluginPrettier
    }
  },
  prettierConfig,
  {
    rules: {
      'prettier/prettier': 'error'
    }
  }
];
