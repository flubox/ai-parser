var webpack = require('webpack');
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
    entry: ['./src/parser.js'],
    output: {
        path: './dist',
        filename: 'parser.js'
    },
    module: {
        loaders: [{
                "test": /\.js?$/,
                "loader": "babel"
            },
            {
                test: /\.json$/,
                loader: "json-loader"
            }
        ]
    },
    plugins: [
        new BrowserSyncPlugin({
            // browse to http://localhost:3000/ during development,
            // ./ directory is being served
            host: 'localhost',
            port: 3000,
            server: {
                baseDir: ['./']
            }
        })
    ]
};