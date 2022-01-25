const { merge } = require('webpack-merge');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');


const createBaseConfig = require('./webpack.config.base');

const createDevConfig = () => {
  const baseConfig = createBaseConfig();
  return merge(
    baseConfig,
    {
      mode: 'development',
      devServer: {
        devMiddleware: {
          // https://github.com/webpack/webpack-dev-server/releases/tag/v4.0.0-beta.3
          publicPath: baseConfig.output.publicPath,
        },
        hot: true,
        host: 'localhost',
        // proxy: {
        //   "/api": {
        //     target: process.env.API_URL,
        //     pathRewrite: { "^/api": "" }
        //   }
        // },
        // https: true,
        port: 8080,
        // Enable gzip compression of generated files.
        compress: true,
        // overlay: false,
        client: {
          overlay: {
            errors: true,
            warnings: false,
          },
        },
        historyApiFallback: {
          disableDotRule: true,
        },
        // TODO: make public folder
        static: ['./src'],
      },
      plugins: [
        new CircularDependencyPlugin({
          // exclude detection of files based on a RegExp
          exclude: /node_modules/,
          // include specific files based on a RegExp
          // include: /dir/,
          // add errors to webpack instead of warnings
          failOnError: true,
          // allow import cycles that include an asyncronous import,
          // e.g. via import(/* webpackMode: "weak" */ './file.js')
          allowAsyncCycles: false,
          // set the current working directory for displaying module paths
          cwd: process.cwd(),
        }),
        new ReactRefreshPlugin(),
      ].filter(Boolean),
    },
  );
};

module.exports = createDevConfig();
