const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const path = require('path')

module.exports = merge(
    commonConfiguration,
    {
        mode: 'production',
        output: {
            filename: 'bundle.[contenthash].js',
            path: path.resolve(__dirname, '../../static/webpack_bundles'),
            clean: true
        }
    }
)
