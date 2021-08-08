const path = require('path');
const webpack = require('webpack');
import Config from 'webpack-config';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CaseSesitiveWebpackPlugin from 'case-sensitive-paths-webpack-plugin';


const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const devMode = process.env.NODE_ENV !== 'production';

export default new Config().merge({
    //entry: ['./index.js'],
    entry: ['./front/src/index.js'],
    output: {
        //path: __dirname + '/public',
        path: __dirname + '/front/public',
        publicPath: '/',
    },
    mode: process.env.NODE_ENV,
    devServer: {
        hot: true,
        historyApiFallback: true,
        port: 6195
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                },
            },
            {
                test: /\.scss$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                use: [
                    devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            minimize: process.env.NODE_ENV === 'production',
                        },
                    },
                    'sass-loader',
                ],
            },
            {
                test: /\.pcss$/,
                exclude: [
                    path.resolve(__dirname, 'stylesheets'),
                    path.resolve(__dirname, 'node_modules'),
                ],
                use: [
                    devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            minimize: process.env.NODE_ENV === 'production',
                            modules: true,
                            localIdentName: '[folder]-[local]-[hash:base64:4]',
                            sourceMap: devMode,
                            importLoaders: 1,
                        },
                    },
                    'postcss-loader',
                ],
            },
            {
                test: /\.css$/,
                include: [
                    path.resolve(__dirname, 'stylesheets'),
                    path.resolve(__dirname, 'node_modules'),
                ],
                use: [
                    devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            minimize: process.env.NODE_ENV === 'production',
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpg|gif|svg|woff|woff2|eot|ttf|otf)$/,
                use: 'file-loader',
            },
        ],
    },
    plugins: [
        ...(devMode
            ? [
                new webpack.HotModuleReplacementPlugin(),
                new CaseSesitiveWebpackPlugin(),
            ]
            : [
                new MiniCssExtractPlugin({
                    //filename: '[name].bundle.css?v=[contenthash]',
                    filename: 'bundle.css?v=[contenthash]',
                }),
            ]),
        new HtmlWebpackPlugin({
            //template: './index.html',
            template: './front/src/index.html',
            inject: 'body',
        }),
    ],
    resolve: {
        extensions: ['.js', '.jsx', '.css', '.scss'],
    },
    externals: {
        config: JSON.stringify({
            backendServiceHost: '/'
        }),
    },
});