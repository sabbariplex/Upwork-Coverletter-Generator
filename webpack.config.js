const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup/index.js',
    settings: './src/settings/index.js',
    subscription: './src/subscription/index.js',
    background: './src/background.js',
    content: './src/content.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  optimization: {
    minimize: false, // Disable minification to avoid eval issues
    splitChunks: false, // Disable code splitting to avoid eval issues
    usedExports: false, // Disable tree shaking to avoid eval issues
    sideEffects: false, // Disable side effects optimization
    concatenateModules: false, // Disable module concatenation
    mangleExports: false, // Disable export mangling
    innerGraph: false // Disable inner graph optimization
  },
  devtool: false, // Disable source maps to avoid eval issues
  mode: 'development', // Force development mode to avoid production optimizations
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/index.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      template: './src/settings/index.html',
      filename: 'settings.html',
      chunks: ['settings']
    }),
    new HtmlWebpackPlugin({
      template: './src/subscription/index.html',
      filename: 'subscription.html',
      chunks: ['subscription']
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' },
        { from: 'public/upwork.png', to: 'upwork.png' },
        { from: 'public/icon.svg', to: 'icon.svg' }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  }
};