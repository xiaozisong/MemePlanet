module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // expo-router 自动注入的 babel 插件由 babel-preset-expo 处理
    ],
  };
};
