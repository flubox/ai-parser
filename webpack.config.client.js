var webpack = require('webpack');

module.exports = {
    entry: ['./src/client.js'],
    output: {
        path: './dist',
        filename: 'client.js'
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