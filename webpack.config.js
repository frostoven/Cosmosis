const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    mode: "production",
    watch: false,
    target: 'node-webkit',
    entry: {
        bundle: './app/index.js',
        // worker: './app/physicsWorker.js',
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
                    presets: ['@babel/preset-react'],
                    plugins: [ '@babel/plugin-proposal-class-properties']
                }
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                  loader: 'css-loader',
                  options: {
                    modules: true
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

    plugins: [
        new ExtractTextPlugin({
            filename: 'bundle.css',
            disable: false,
            allChunks: true
        })
    ],

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
}
