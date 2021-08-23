module.exports = {
  plugins: [
      // Stage 2
      ['@babel/plugin-proposal-decorators', {legacy: true}],
      '@babel/plugin-proposal-function-sent',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-proposal-numeric-separator',
      '@babel/plugin-proposal-throw-expressions',

      // Stage 3
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-syntax-import-meta',
      ['@babel/plugin-proposal-class-properties', {loose: true}],
      '@babel/plugin-proposal-json-strings',

      '@babel/plugin-proposal-do-expressions',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-partial-application',
      ['@babel/plugin-proposal-pipeline-operator', {proposal: 'smart'}],
      ['@babel/plugin-transform-runtime', {regenerator: true}],

      'react-hot-loader/babel',
  ],
  presets: ['@babel/preset-env', '@babel/preset-react'],
};