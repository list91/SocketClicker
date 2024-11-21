import { merge } from 'webpack-merge';
import common from './webpack.common';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';

// Get base config without plugins
const { plugins: commonPlugins, ...baseConfig } = common;

// Create config for single bundle
const config: webpack.Configuration = {
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
          to: 'popup.html',
          transform: {
            transformer(content) {
              return Buffer.from(
                content.toString().replace('popup.js', 'bundle.js')
              );
            }
          }
        }
      ]
    })
  ]
};

export default merge(baseConfig, config);
