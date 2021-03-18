const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.MODE || 'development',
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].[hash:7].js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'style-loader',
          {
            loader: 'css-loader',
            options: { import: true, },
          },
        ],
      },
      {
        test: /favicon\.ico$/,
        loader: 'file-loader',
        options: {
          limit: 1,
          name: '[name].[ext]',
        },
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
        },
      },
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      publicPath: '/',
    }),
    new VueLoaderPlugin(),
  ]
}