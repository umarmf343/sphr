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
            headers: {
              'Content-Security-Policy': [
                "default-src 'self'",
                "connect-src 'self' ws://localhost:3000 ws://0.0.0.0:3000",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob:",
                "font-src 'self' data:"
              ].join('; '),
            },
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
