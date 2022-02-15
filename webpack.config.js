const webpack = require('webpack');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const development = process.env.MODE !== 'production';

module.exports = {
  mode: development ? 'development' : 'production',
  devtool: development && 'source-map',
  entry: './src/loader.js',
  cache: { type: 'filesystem' },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: `[name].${development ? 'dev' : '[fullhash:7]'}.js`,
    publicPath: '/',
  },
  resolve: {
    cacheWithContext: true,
    extensions: ['', '.js', '.jsx', '.ts', '.tsx'],
  },
  watchOptions: { poll: true, ignored: /node_modules/ },
  module: {
    rules: [
      {
        test: /\.ya?ml$/,
        type: 'json',
        use: 'yaml-loader',
      },
      {
        test: /\.js(on|x)?$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/,
        use: [
          {
            loader: 'swc-loader',
            options: {
              jsc: {
                keepClassNames: true,
                loose: true,
                parser: {
                  syntax: 'ecmascript',
                  jsx: true,
                  dynamicImport: true,
                  exportDefaultFrom: true,
                  experimental: { styledComponent: true },
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    refresh: development,
                  },
                },
                target: 'es2016',
              },
            },
          },
        ],
      },
      /* {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, 'src'),
        exclude: /node_modules/,
        use: [
          {
            loader: 'swc-loader',
            options: {
              jsc: {
                keepClassNames: true,
                loose: true,
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                  dynamicImport: true,
                  exportDefaultFrom: true,
                  experimental: { styledComponent: true },
                },
                transform: {
                  react: {
                    runtime: 'automatic',
                    refresh: development,
                  },
                },
                target: 'es2016',
              },
            },
          },
        ],
      }, */
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { import: true },
          },
        ],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg|wav|ico)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 16 * 1024,
          },
        },
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      favicon: './res/favicon.ico',
      template: './src/index.html',
      publicPath: '/',
    }),
    development &&
      new webpack.EvalSourceMapDevToolPlugin({
        exclude: ['vendor'],
        columns: true,
        module: true,
      }),
    development &&
      new ReactRefreshWebpackPlugin({ overlay: { sockIntegration: 'whm' } }),
  ].filter(Boolean),
  devServer: {
    devMiddleware: {
      writeToDisk: true,
    },
    static: [path.resolve(__dirname, 'public')],
    hot: true,
    host: '0.0.0.0',
    headers: { 'Access-Control-Allow-Origin': '*' },
    server: { type: 'http' },
  },
};
