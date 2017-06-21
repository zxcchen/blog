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
        filename: "common.js" //PROD ? "common.[chunkhash].js" : "common.js"
    }),
    new webpack.optimize.CommonsChunkPlugin({
        name: "entry",
        chunks: ["common"],
        filename: "entry.js" //PROD ? "entry.[chunkhash].js" : "entry.js"
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

//尽管可以在js中通过require css资源的方式来minify css(指定ExtractTextPlugin),但处于个人偏好使用gulp来实现这个功能

module.exports = {
    entry: {
        main: "./client/main.js",
        common: ["jquery"]
    },
    output: {
        path: PROD ? __dirname + "/deploy/prod/js" : __dirname + "/deploy/dev/js",
        filename: "main.js" //PROD ? "main.[chunkhash].js" : "main.js"
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