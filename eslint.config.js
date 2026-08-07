// ESLint 9 flat config.
//
// Scoped deliberately: this is the first time lint has ever run on this
// codebase, so the rule set targets the classes of bug that actually bit us
// (unused code left behind by refactors, hook dependency mistakes, accidental
// globals) rather than turning on everything and burying real findings under
// thousands of stylistic complaints.

const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'ios/**',
      'dist/**',
      '.expo/**',
      'coverage/**',
      'patches/**',
      'scripts/**',
      'plugins/**',
      'babel.config.js',
      'eslint.config.js',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        __DEV__: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        AbortController: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Stale deps silently serve old data — exactly the class of bug behind
      // the screens that stopped refreshing.
      'react-hooks/exhaustive-deps': 'warn',

      // `any` is pervasive in the service layer today. Warn so new code gets
      // pushed toward types without failing the build on legacy signatures.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Leftovers from refactors — this is what dead code looks like before
      // it becomes 6,000 lines of it.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],

      // TypeScript already resolves identifiers, and it knows about lib globals
      // (`RequestInit`, `URLSearchParams`, `NodeJS`) that ESLint does not. Left
      // on, this rule reports only false positives on typed files — which is
      // why typescript-eslint recommends disabling it.
      'no-undef': 'off',

      // Real bugs, not style.
      'no-empty': ['error', { allowEmptyCatch: true }],
      eqeqeq: ['error', 'smart'],
    },
  },

  {
    // React Navigation's typed-routes pattern is a `declare global` module
    // augmentation; there is no ES-module equivalent.
    files: ['src/types/navigation.ts'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  {
    // These two use a lazy `require()` on purpose, to break an import cycle
    // that would otherwise deadlock module initialisation.
    files: [
      'src/services/core/SupabaseService.ts',
      'src/services/health/HealthService.ts',
    ],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  {
    files: ['tests/**/*.{ts,tsx,js}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        global: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'writable',
        console: 'readonly',
        setTimeout: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
