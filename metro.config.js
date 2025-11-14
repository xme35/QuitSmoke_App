const path = require('path');
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  'firebase/auth/react-native': path.resolve(
    __dirname,
    'node_modules/firebase/node_modules/@firebase/auth/dist/rn/index.js',
  ),
};

module.exports = withNativeWind(config, { input: './global.css' });