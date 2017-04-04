var webpack = require('webpack');

module.exports = {
    entry: ['./src/server.js'],
    output: {
        path: './dist',
        filename: 'server.js'
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
        new webpack.DefinePlugin({ "global.GENTLY": false })
    ],
    node: {
        __dirname: true,
    },
    target: 'node'
};