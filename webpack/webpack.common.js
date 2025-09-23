const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const BundleTracker = require("webpack-bundle-tracker");
const fs = require('fs');
const path = require('path')
const webpack = require('webpack');
const dotenv = require('dotenv');

// Call dotenv and it will return an Object with a parsed key 
const env = dotenv.config().parsed;

// Reduce it to a nice object
const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
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
                { from: path.resolve(__dirname, '../static') }
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
