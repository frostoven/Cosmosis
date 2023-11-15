const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const pluginManifest = require('./app/plugins/pluginWebWorkersEnabled.json');

module.exports = {
  mode: "production",
  watch: false,
  target: 'node-webkit',
  entry: {
    game: './app/index.js',
    ...pluginManifest.pluginWorkers,
  },
  output: {
    path: __dirname + '/build',
    publicPath: 'build/',
    filename: '[name].js',
    // sourceMapFilename: '[name].js.map',
  },
  // This won't work out-of-the-box due to a bug in this version of the
  // Chromium engine. If you'd like to use source maps, see the 9 November 23
  // comment here:
  // https://github.com/nwjs/nw.js/issues/7724
  // Disabling it by default as it's incredibly slow anyway.
  // devtool: 'source-map',
  // devtool: 'eval-source-map',
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)?$/,
        loader: 'babel-loader',
        options: {
          compact: false,
          presets: [
            [
              '@babel/preset-typescript', {
                "isTSX": true,
                "allExtensions": true,
              }
            ],
          '@babel/preset-react'
          ],
          plugins: [
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-proposal-numeric-separator',
            '@babel/plugin-transform-nullish-coalescing-operator',
          ]
        }
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          loader: 'css-loader',
          options: {
            compact: false,
            modules: true,
          }
        })
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.ts', '.json', '.jsx', '.tsx']
  },

  stats: {
    // Silence warnings which are actually false positives.
    warningsFilter: [
      '"export \'CannonDebugRenderer\' (imported as \'THREE\') was not found in \'three\'',
      (warning) => false
    ]
  }
};
