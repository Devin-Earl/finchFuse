const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]', // Output images in the 'img' folder in 'dist'
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      template: './src/about.html',
      filename: 'about.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/style.css', to: 'style.css' },
        { from: 'src/aws-exports.js', to: 'aws-exports.js' },
        { from: 'src/img', to: 'img' }, // Copy the entire img folder
      ],
    }),
  ],
  mode: 'production',
};
