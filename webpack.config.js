var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
        index: path.resolve(__dirname, 'src/parser.js'),
        client: path.resolve(__dirname, 'src/client.js')
    },
    output: {
        path: path.resolve('dist'),
        filename: '[name].js',
        chunkFilename: '[name].js'
    },
    module: {
        loaders: [
            {
                "test": /\.js?$/,
                "include": [
                    path.resolve(__dirname, "src")
                ],
                "loader": "babel-loader",
            },
            {
                "test": /\.json?$/,
                "loader": "json-loader",
            }
        ]
    },
    devtool: 'source-map',
    plugins: [
        new BrowserSyncPlugin({
            host: 'localhost',
            port: 3000,
            server: {
            baseDir: ['./']
            }
        })
    ]
};