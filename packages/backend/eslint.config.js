import rootConfig from '../../eslint.config.js';

export default [
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      'no-console': 'warn',
    },
  },
];
