const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

let config = getDefaultConfig(projectRoot);

// pnpm monorepo 兼容：让 Metro 能 resolve 到 workspace 内的文件和 hoisted 的依赖
config.watchFolders = [workspaceRoot];

// 把 .pnpm 中的已安装 scope 包目录加入搜索路径
const pnpmStore = path.resolve(workspaceRoot, 'node_modules', '.pnpm');
if (fs.existsSync(pnpmStore)) {
  // 遍历 .pnpm 目录，收集所有真实存在的 node_modules 路径
  // 这能确保 @scoped/package 和其他一切包都能被 Metro 找到
  const scopes = fs.readdirSync(pnpmStore).filter((d) => d.startsWith('@'));
  const extraPaths = scopes
    .map((scope) => path.resolve(pnpmStore, scope, 'node_modules'))
    .filter((p) => fs.existsSync(p));
  config.resolver.nodeModulesPaths = [
    ...(config.resolver.nodeModulesPaths || []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
    pnpmStore,
    ...extraPaths,
  ];
} else {
  config.resolver.nodeModulesPaths = [
    ...(config.resolver.nodeModulesPaths || []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ];
}

module.exports = withNativeWind(config, { input: './src/styles/global.css' });
