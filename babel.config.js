module.exports = function (api) {
  // Config depends on NODE_ENV, so cache per-environment rather than forever.
  api.cache.using(() => process.env.NODE_ENV);

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // The app logs heavily on the habit-list render path, and those calls
      // still execute in release builds unless compiled out. `error` is kept
      // so real crashes stay visible in device logs.
      ...(isProduction
        ? [['transform-remove-console', { exclude: ['error'] }]]
        : []),
      // Reanimated's plugin must remain last.
      'react-native-reanimated/plugin',
    ],
  };
};
