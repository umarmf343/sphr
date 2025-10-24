const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const BundleTracker = require("webpack-bundle-tracker");
const fs = require('fs');
const path = require('path')
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from the optional .env file and fall back to
// existing process environment values. When the .env file is missing we still
// need to provide sane defaults so the webpack build does not crash.
const dotenvResult = dotenv.config();

if (dotenvResult.error && dotenvResult.error.code !== 'ENOENT') {
  throw dotenvResult.error;
}

const envFromFile = dotenvResult.parsed || {};

// Ensure that any environment variables referenced in the source always have
// a defined value to avoid runtime ReferenceError when process.env is
// evaluated in the browser bundle.
const requiredEnvKeys = new Set([
  'GOOGLE_MAPS_API_KEY',
  'GOOGLE_TILES_API_KEY',
  ...Object.keys(envFromFile),
]);

const envKeys = Array.from(requiredEnvKeys).reduce((acc, key) => {
  const value = envFromFile[key] ?? process.env[key] ?? '';
  acc[`process.env.${key}`] = JSON.stringify(value);
  return acc;
}, {});

module.exports = {
    entry: path.resolve(__dirname, '../src/index.js'),
    output:
    {
        filename: 'bundle.[contenthash].js',
        path: path.resolve(__dirname, '../../static/webpack_bundles')
    },
    devtool: 'source-map',
    plugins:
    [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../src/index.html'),
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../static'),
                    globOptions: {
                        dot: true,
                    },
                }
            ]
        }),
        new MiniCSSExtractPlugin({
          filename: 'styles/[name].[contenthash].css',
          chunkFilename: 'styles/[id].[contenthash].css',
        }),
        new BundleTracker({ path: __dirname, filename: "webpack-stats.json" }),
        new webpack.DefinePlugin(envKeys)
    ],
    module:
    {
        rules:
        [
            // HTML
            {
                test: /\.(html)$/,
                use: ['html-loader']
            },

            // JS
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use:
                [
                    'babel-loader'
                ]
            },

            // CSS
            {
                test: /\.css$/,
                use:
                [
                    MiniCSSExtractPlugin.loader,
                    'css-loader',
                    'postcss-loader' 
                ]
            },

            // Images
            {
                test: /\.(jpg|png|gif|svg)$/,
                use:
                [
                    {
                        loader: 'file-loader',
                        options:
                        {
                            outputPath: 'assets/images/'
                        }
                    }
                ]
            },
            
            // Shaders
            {
                test: /\.glsl$/,
                use: 'raw-loader',
            },

            // Fonts
            {
                test: /\.(ttf|eot|woff|woff2)$/,
                use:
                [
                    {
                        loader: 'file-loader',
                        options:
                        {
                            outputPath: 'assets/fonts/'
                        }
                    }
                ]
            }
        ]
    }
}
