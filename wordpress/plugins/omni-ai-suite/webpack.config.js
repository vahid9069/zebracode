const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

// Filter out CleanWebpackPlugin to preserve static assets such as assets/js/lib/
const filteredPlugins = (defaultConfig.plugins || []).filter(
  (plugin) => plugin.constructor.name !== 'CleanWebpackPlugin'
);

module.exports = {
  ...defaultConfig,
  entry: {
    admin: path.resolve(__dirname, 'src/admin/index.js'),
    gutenberg: path.resolve(__dirname, 'src/gutenberg/index.js'),
  },
  output: {
    ...defaultConfig.output,
    filename: '[name].js',
    path: path.resolve(__dirname, 'assets/js'),
    clean: false,
  },
  plugins: filteredPlugins,
};
