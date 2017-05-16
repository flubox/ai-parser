var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: ['./src/parser.js'],
    entry: {
        index: path.resolve(__dirname, 'src/parser.js'),
        demo: path.resolve(__dirname, 'src/client.js')
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
    devtool: 'source-map'
};