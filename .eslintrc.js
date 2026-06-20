module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'boundaries'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/**'],
  settings: {
    // Resolve the @contexts/* TS path aliases so boundaries can classify the
    // import targets as bounded-context elements.
    'import/resolver': {
      typescript: { project: 'tsconfig.json' },
    },
    // Bounded-context boundary enforcement. Element order matters: the first
    // matching pattern wins, so the auth transversal allowlist and adapters are
    // matched before the generic `context` element.
    'boundaries/include': ['src/contexts/**/*.ts'],
    'boundaries/elements': [
      // 1. Auth transversal infrastructure — shared cross-cutting auth (JWT
      //    guard, @CurrentUser decorator, app-role enum). Any context may import
      //    these directly; they are NOT modelled as a port.
      {
        type: 'auth-shared',
        mode: 'full',
        pattern: [
          'src/contexts/auth/infrastructure/guards/jwt-auth*',
          'src/contexts/auth/infrastructure/guards/app-role*',
          'src/contexts/auth/infrastructure/decorators/current-user*',
          'src/contexts/auth/domain/enums/app-role*',
        ],
      },
      // 2. Adapters — the anti-corruption seam. The ONLY place allowed to import
      //    another bounded context's domain/application.
      {
        type: 'context-adapter',
        mode: 'full',
        pattern: 'src/contexts/*/infrastructure/adapters/**',
        capture: ['context', 'path'],
      },
      // 3. Everything else inside a bounded context.
      {
        type: 'context',
        mode: 'full',
        pattern: 'src/contexts/*/**',
        capture: ['context', 'path'],
      },
    ],
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // A bounded context may only import its OWN context. Reaching another
    // context's domain/application is allowed exclusively from
    // infrastructure/adapters/ (the port implementation). Auth transversal
    // infrastructure (auth-shared) is exempt.
    'boundaries/element-types': [
      'error',
      {
        default: 'allow',
        rules: [
          {
            from: ['context'],
            disallow: [
              ['context', { context: '!${from.context}' }],
              ['context-adapter', { context: '!${from.context}' }],
            ],
            message:
              "Cross-context import is not allowed: '${from.context}' must reach '${target.context}' through a port (application/ports) + adapter (infrastructure/adapters). Exempt: auth guards/decorators/app-role enum.",
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/**/*.spec.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@nestjs/testing',
                message:
                  'Unit tests must use manual instantiation (jest.Mocked<T>). @nestjs/testing is allowed only in test/integration/ and test/**/*.e2e-spec.ts.',
              },
            ],
          },
        ],
      },
    },
  ],
};
