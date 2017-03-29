var webpack = require('webpack');

module.exports = {
    entry: ['./src/cli.js'],
    output: {
        path: './dist',
        filename: 'cli.js'
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
    target: 'node'
};