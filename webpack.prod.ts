const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  devtool: 'source-map',
  entry: {
    background: './src/background.ts',
    content: './src/content.ts',
    popup: './src/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json' },
        { from: 'src/popup.html' },
        { from: 'static', to: 'static' }
      ]
    })
  ]
};
