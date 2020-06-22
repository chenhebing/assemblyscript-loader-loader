// eslint-disable-next-line
const { deepmerge, tslint } = require('@ice/spec');

module.exports = deepmerge(tslint, {
  rules: {
    'array-bracket-spacing': [ 'error', 'always', { 'objectsInArrays': false, 'arraysInArrays': false, 'singleValue': true }],
    'object-curly-spacing': [ 'error', 'always' ],
    quotes: [ 'error', 'single', { avoidEscape: true }],
    'jsx-quotes': [ 'error', 'prefer-double' ],
    'no-useless-constructor': 'error',
    'spaced-comment': [ 'error', 'always', { 'markers': [ '/' ] }],
    'comma-spacing': [ 'error', { 'before': false, 'after': true }],
    'react-hooks/exhaustive-deps': 'error',
    'eol-last': [ 'error', 'always' ],
    'space-before-function-paren': [ 'error', {
      'anonymous': 'never',
      'named': 'never',
      'asyncArrow': 'always',
    }],
    'comma-dangle': [ 'error', 'always-multiline' ],
    'semi': [ 'error', 'always' ],
    'key-spacing': [ 'error', { afterColon: true }],
    '@typescript-eslint/no-useless-constructor': 'error',
    'react/jsx-filename-extension': [
      'error',
      {
        extensions: [ '.js', '.jsx', '.tsx' ],
      },
    ],
  },
});
