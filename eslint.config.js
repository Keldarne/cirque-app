const globals = require('globals');

module.exports = [
  {
    files: ['backend/**/*.js', '*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
    },
  },
  {
    ignores: [
      'node_modules/',
      'frontend/node_modules/',
      'frontend/build/',
      'coverage/',
    ],
  },
];
