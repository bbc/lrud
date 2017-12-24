const path = require('path')

module.exports = {
  entry: path.resolve('src/main.js'),
  output: {
    path: path.resolve('public'),
    filename: 'main.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  devtool: 'source-map'
}
