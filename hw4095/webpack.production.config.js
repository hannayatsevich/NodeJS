import webpack from 'webpack';
import Config from 'webpack-config';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';


export default new Config().extend('webpack.base.config.js').merge({
    output: {
        filename: `bundle.min.js`,
    },
    devtool: false,
    optimization: {
        minimize: true,
        /*minimizer: [
         /!* new webpack.optimize.UglifyJsPlugin({
            compress: {
              warnings: true
            }
          })*!/
        ]*/
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production'),
            },
        }),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            {
                from: 'images',
                to: 'images',
            },
            {
                from: 'fonts',
                to: 'fonts',
            },
            {
                from: 'favicon.ico',
                to: 'favicon.ico',
            },
        ]),
    ],
});