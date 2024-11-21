import { merge } from 'webpack-merge';
import common from './webpack.common';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export default merge(common, {
  mode: 'production',
  entry: './src/background.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist-single'),
  },
  optimization: {
    minimize: true,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: './src/manifest.single.json',
          to: 'manifest.json'
        },
        {
          from: './src/popup.html',
          to: 'popup.html'
        }
      ]
    })
  ]
});
