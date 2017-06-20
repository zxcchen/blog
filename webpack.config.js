const path = require("path");
const webpack = require("webpack");

//获取生产环境或开发环境的标识
const PROD = process.env.NODE_ENV === 'production';
const GLOBALS = {
    '__IS_PROD__': JSON.stringify(PROD)
};

//指定需要使用的webpack插件
let webpackPlugins = [
    new webpack.optimize.CommonsChunkPlugin({
        name: "common",
        filename: "common.[chunkhash].js"
    }),
    new webpack.optimize.CommonsChunkPlugin({
        name: "entry",
        chunks: ["common"],
        filename: "entry.[chunkhash].js"
    }),
    new webpack.DefinePlugin(GLOBALS)
];

if (PROD) { //线上环境为了节省流量使用压缩
    webpackPlugins.push(new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false
        }
    }));
}

//todo:加入source map支持，方便线上调试代码

module.exports = {
    entry: {
        main: "./client/main.js",
        common: ["jquery"]
    },
    output: {
        path: PROD ? __dirname + "/deploy/prod/" : __dirname + "/deploy/dev/",
        filename: PROD ? "main.[chunkhash].js" : "main.js"
    },
    plugins: webpackPlugins,
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader?presets[]=es2015'
        }]
    }
};