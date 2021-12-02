const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  mode: "production",
  watch: false,
  target: 'node-webkit',
  entry: {
    game: './app/index.js',
    offscreenSkybox: './app/webWorkers/offscreenSkybox.js',
    // physicsWorker: './app/webWorkers/physicsWorker.js',
  },
  output: {
    path: __dirname + '/build',
    publicPath: 'build/',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        loader: 'babel-loader',
        options: {
          compact: false,
          presets: ['@babel/preset-react'],
          plugins: [ '@babel/plugin-proposal-class-properties']
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
    extensions: ['.js', '.json', '.jsx']
  },

  stats: {
    // Silence warnings which are actually false positives.
    warningsFilter: [
      '"export \'CannonDebugRenderer\' (imported as \'THREE\') was not found in \'three\'',
      (warning) => false
    ]
  }
};
