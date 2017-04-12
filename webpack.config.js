var webpack = require('webpack');

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
    }
};