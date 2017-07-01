const path = require('path');
const _ = require('lodash');
const webpack = require('webpack');
const BabiliPlugin = require('babili-webpack-plugin');

const globalIncludeExcludeRules = {
  include: [
    path.resolve(__dirname, "src"),
  ],
  exclude: [
    path.resolve(__dirname, "src/third-party"),
  ],
};

module.exports = {
  target: "web",
  entry: {
    'web-worker-components-lite': './src/web-worker-components-lite.js',
    'web-worker-components': './src/web-worker-components.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    modules: [
      path.resolve('./src'),
      path.resolve('./node_modules'),
    ],
  },
  module: {
    rules: [

      // # Loaders for our source code.

      _.merge({}, globalIncludeExcludeRules, {
        test: /\.js$/,
        use: [
          "babel-loader",
          "eslint-loader",
        ],
      }),

    ],
  },
  devtool: "source-map",
  plugins:[
    new webpack.DefinePlugin({
        VERBOSE: false,
        'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new BabiliPlugin(),
  ],
};
