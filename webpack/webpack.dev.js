const path = require('path');
const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')

const infoColor = (_message) =>
{
    return `\u001b[1m\u001b[34m${_message}\u001b[39m\u001b[22m`
}

module.exports = merge(
    commonConfiguration,
    {
        output: {
            filename: 'bundle.[contenthash].js',
            path: path.resolve(__dirname, '../static/webpack_bundles/'),
            publicPath: "http://localhost:3000/static/webpack_bundles/",
        },
        mode: 'development',
        devServer:
        {
            host: '0.0.0.0',
            allowedHosts: 'all',
            port: 3000,
            historyApiFallback: {
              index: '/index.html',
            },
            devMiddleware: {
              publicPath: '/',
            },
            static: {
              directory: path.resolve(__dirname, "..", "static"),
              staticOptions: {
                dotfiles: 'allow',
              },
              publicPath: "/static/",
              serveIndex: true,
              watch: true,
            },
        }
    }
)
