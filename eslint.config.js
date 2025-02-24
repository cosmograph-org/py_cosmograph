import importPlugin from 'eslint-plugin-import'
import stylistic from '@stylistic/eslint-plugin'
import stylisticTs from '@stylistic/eslint-plugin-ts'
import stylisticJs from '@stylistic/eslint-plugin-js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** @type {import('eslint').Linter.Config[]} */
export default [
  stylistic.configs['recommended-flat'],
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.browser } },
  ...tseslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
  {
    plugins: {
      '@stylistic': stylistic,
      '@stylistic/ts': stylisticTs,
      '@stylistic/js': stylisticJs,
    },
    rules: {
      'indent': 'off',
      'object-curly-spacing': ['error', 'always'],
      'prefer-template': 'error',
      'no-useless-constructor': 'off',
      'import/extensions': 0,
      'import/no-extraneous-dependencies': 0,
      'import/prefer-default-export': 0,
      'import/first': ['error', 'absolute-first'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-undef': 0,
      'no-unused-vars': 0,
      'no-use-before-define': ['error'],
      'no-multiple-empty-lines': ['error', { max: 2, maxBOF: 0, maxEOF: 0 }],
      'max-len': ['warn', { code: 200, tabWidth: 2, ignoreTrailingComments: true, ignoreComments: true, ignoreUrls: true }],

      'keyword-spacing': ['error'],

      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never',
      }],
      '@stylistic/type-annotation-spacing': ['error'],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      }],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],

      '@typescript-eslint/no-unused-expressions': ['error'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': ['warn'],
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
      }],
    },
  },
]
