const path = require('path');
const sliceArgs = Function.prototype.call.bind(Array.prototype.slice);
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

function root(args) {
    args = sliceArgs(arguments, 0);
    return path.join.apply(path, [__dirname].concat(args));
}

module.exports = {
    devtool: 'inline-source-map',
    cache: true,
    mode: 'development',
    context: __dirname,
    stats: {
      colors: true,
      reasons: true
    },
    entry: {
      'hook': ['./src/backend/hook'],
      'detector': ['./src/backend/detector'],
      'proxy': ['./src/backend/proxy'],
      'backend': ['./src/backend/index'],
      'devtools-background': ['./src/devtools-background/index'],
      'devtools': ['./src/devtools/index'],
      'background': ['./src/background/index']
    },

    output: {
      path: root('build'),
      filename: '[name].js',
      sourceMapFilename: '[name].js.map',
      chunkFilename: '[id].chunk.js'
    },

    plugins: [
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: "[name].css",
        chunkFilename: "[id].css"
      })
    ],

    module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
              loader: 'babel-loader'
            }
          },
          {
            test: /\.css$/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader
              },
              "css-loader"
            ]
          },
          {
            test: /\.(png|jp(e*)g|svg)$/,
            use: [{
              loader: 'url-loader',
              options: {
                limit: 8000, // Convert images < 8kb to base64 strings
                name: 'images/[hash]-[name].[ext]'
              }
            }]
          }
        ]
      }
  };