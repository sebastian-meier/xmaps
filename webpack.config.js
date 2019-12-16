const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    main: './dst/main.js'
  },
  output: {
    path: __dirname + "/js",
    filename: '[name].js',
  },

  resolve: {
    extensions: [".js"]
  },

  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.js$/,
        // Babel options are in .babelrc
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
};