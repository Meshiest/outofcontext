const { VueLoaderPlugin } = require('vue-loader');
const path = require('path');


module.exports = {
  mode: process.env.MODE || 'development',
  devtool: process.env.MODE !== 'production' && 'source-map',
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
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
          {
            loader: 'css-loader',
            options: {
              import: true,
            },
          },
        ],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000',
      },
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
  ]
}