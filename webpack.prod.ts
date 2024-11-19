import {Configuration} from 'webpack'
import {merge} from 'webpack-merge'
import config from './webpack.common'
import * as path from 'path';
import CopyPlugin from 'copy-webpack-plugin';

const merged = merge<Configuration>(config,{
    mode: 'production',
    devtool: 'source-map',
    entry: {
      background: './src/background.ts',
      content: './src/content.ts',
      popup: './src/popup.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js'
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
          { from: 'src/popup.html' }
        ]
      })
    ]
})

// noinspection JSUnusedGlobalSymbols
export default merged
