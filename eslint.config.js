'use strict';

const js = require('@eslint/js');
// eslint-plugin-n >= 18.2 exports the plugin directly from require();
// older versions wrapped it in `.default`
const pluginNExport = require('eslint-plugin-n');
const pluginN = pluginNExport.default || pluginNExport;
const prettierRecommended = require('eslint-plugin-prettier/recommended');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'blueprints/*/files/',
      'vendor/',
      'dist/',
      'tmp/',
      'node_modules/',
      'coverage/',
      '.eslintcache',
    ],
  },
  js.configs.recommended,
  prettierRecommended,
  // Node CommonJS files
  {
    files: [
      'eslint.config.js',
      '.prettierrc.js',
      'index.js',
      'lib/**/*.js',
      'blueprints/*/index.js',
      'config/**/*.js',
    ],
    ...pluginN.configs['flat/recommended-script'],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...pluginN.configs['flat/recommended-script'].rules,
    },
  },
  // Config files (can use devDependencies)
  {
    files: ['eslint.config.js', '.prettierrc.js'],
    rules: {
      'n/no-unpublished-require': 'off',
    },
  },
  // Test files (ESM)
  {
    files: ['tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
  },
];
