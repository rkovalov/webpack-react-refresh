const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const ReactRefreshTypeScript = require('react-refresh-typescript');


const styleLoaders = require('./styleLoaders');
const directory = fs.realpathSync(process.cwd());
const resolve = (relativePath) => path.resolve(directory, relativePath);
const IS_DEV = process.env.NODE_ENV === 'development';
const IS_PROD = process.env.NODE_ENV === 'production';
const getStyleLoaders = styleLoaders({ IS_DEV, IS_PROD });
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const localIdentName = '[name]_[local]__[hash:base64:5]';

module.exports =  () => ({
  devtool: 'cheap-module-source-map',
  entry: [resolve('./src/index.tsx')],
  // target: "web", // by default browserlist
  // stats: 'verbose',
  performance: {
    // TODO: split bundle to chunks
    hints: 'warning',
  },
  output: {
    path: resolve('./dist'),
    // publicPath: resolve('./public'),
    // filename: IS_PROD ? '[name].[contenthash:8].js' : '[name].bundle.js',
    // chunkFilename: IS_PROD ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
    // https://github.com/webpack/webpack/issues/9297
    filename: pathdata =>
      (pathdata.chunk || {}).chunkReason
        ? IS_PROD
          ? '[name].[contenthash:8].chunk.js'
          : '[name].chunk.js'
        : IS_PROD
        ? '[name].[contenthash:8].js'
        : '[name].bundle.js',
  },
  resolve: {
    extensions: ['.js', '.jsx', '.scss', '.json', '.ts', '.tsx'].filter(Boolean),
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.(js|mjs|jsx|ts|tsx|css)$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        loader: '@ts-tools/webpack-loader',
        options: {
          cache: IS_DEV,
          cacheDirectoryPath: `node_modules/.cache/${process.env.NODE_ENV}`,
          transformers: {
            before: [ReactRefreshTypeScript()],
          },
        },
      },
      {
        test: cssRegex,
        exclude: cssModuleRegex,
        use: getStyleLoaders({
          importLoaders: 1,
          sourceMap: IS_PROD,
          modules: {
            mode: 'icss',
          },
        }),
        // Don't consider CSS imports dead code even if the
        // containing package claims to have no side effects.
        // Remove this when webpack adds a warning or an error for this.
        // See https://github.com/webpack/webpack/issues/6571
        sideEffects: true,
      },
      {
        test: cssModuleRegex,
        use: getStyleLoaders({
          importLoaders: 1,
          sourceMap: IS_PROD,
          modules: {
            localIdentName,
            exportLocalsConvention: 'camelCase',
          },
        }),
      },
      {
        test: sassRegex,
        exclude: sassModuleRegex,
        use: getStyleLoaders(
          {
            importLoaders: 3,
            sourceMap: IS_PROD,
            modules: {
              // icss give possibility to import vars from sass to js
              mode: 'icss',
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                // https://github.com/webpack-contrib/sass-loader/issues/416
                // https://github.com/webpack-contrib/sass-loader/issues/763
                outputStyle: 'expanded',
              },
            },
          }
        ),
        // Don't consider CSS imports dead code even if the
        // containing package claims to have no side effects.
        // Remove this when webpack adds a warning or an error for this.
        // See https://github.com/webpack/webpack/issues/6571
        sideEffects: true,
      },
      {
        test: sassModuleRegex,
        use: getStyleLoaders(
          {
            importLoaders: 3,
            sourceMap: IS_PROD,
            modules: {
              localIdentName,
              exportLocalsConvention: 'camelCase',
            },
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                // https://github.com/webpack-contrib/sass-loader/issues/416
                // https://github.com/webpack-contrib/sass-loader/issues/763
                outputStyle: 'expanded',
              },
            },
          }
        ),
      },
      {
        test: /\.(png|gif|svg|jpe?g)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name]-[contenthash].[ext]',
              esModule: false,
            },
          },
          'img-loader',
        ],
      },
      // doesnt work with resolve-url-loader
      // https://github.com/bholloway/resolve-url-loader/issues/213
      // {
      //   test: /\.(woff|eot|ttf|woff2|otf)$/,
      //   use: [
      //     {
      //       loader: 'file-loader',
      //       options: {
      //         name: 'fonts/[name]-[contenthash].[ext]',
      //         // esModule need set to false for properly resolve url by resolve-url-loader
      //         esModule: false,
      //       },
      //     },
      //   ],
      // },
    ].filter(Boolean),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: resolve('./src/index.html'),
      env: process.env,
      minify: {
        removeComments: false,
        // By Default
        collapseWhitespace: true,
        keepClosingSlash: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      },
    }),
    // Generate an asset manifest file with the following content:
    // - "files" key: Mapping of all asset filenames to their corresponding
    //   output file so that tools can pick it up without having to parse
    //   `index.html`
    // - "entrypoints" key: Array of files which are included in `index.html`,
    //   can be used to reconstruct the HTML if necessary
    new WebpackManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: resolve('./public'),
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);
        const entrypointFiles = entrypoints.main.filter(fileName => !fileName.endsWith('.map'));

        return {
          files: manifestFiles,
          entrypoints: entrypointFiles,
        };
      },
    }),
  ].filter(Boolean),
});
