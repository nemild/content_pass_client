module.exports = {
    entry: {
        backend: "./src/extension_script.js",
        frontend: "./src/popup.js"
    },
    output: {
        path: __dirname+ '/js',
        filename: "[name].js"
    },
    devtool: 'source-map',
    module: {
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules|bower_components)/,
          loaders: ['babel-loader']
        }
      ]
    }
};
