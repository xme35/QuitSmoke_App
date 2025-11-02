const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

console.log(
  "[metro.config] transformer.asyncRequireModulePath:",
  config?.transformer?.asyncRequireModulePath ?? "<undefined>"
);

module.exports = withNativeWind(config, { input: './global.css' });