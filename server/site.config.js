const path = require("path");
const PROD = process.env.NODE_ENV === "production";

let cdnRoot = PROD ? "deploy/prod" : "deploy/dev";
let root = path.resolve("./");

//获取当前前端代码各文件的版本号的manifest，此文件由gulp生成
const cssManifest = require(path.join(root, cdnRoot, "css-manifest.json"));
const jsManifest = require(path.join(root, cdnRoot, "script-manifest"));

function buildManifest(target, type, source) {
    const assetNameRegExp = /^(.*)\.\w+/
    target[type] = {};
    for (let name in source) {
        let result = assetNameRegExp.exec(name);
        if (result && result[1]) {
            target[type][result[1]] = source[name];
        }
    }
    return target;
}

const assetManifest = buildManifest(buildManifest({
    cdnLocation: "/"+cdnRoot
}, "css", cssManifest), "js", jsManifest);

module.exports = {
    //是否是线上环境
    prod: PROD,
    //mongodb url
    dbUrl: "mongodb://127.0.0.1:27017/blog",
    //mongodb 用户表
    dbUserTable: "user",
    //mongodb 文章表
    dbBlogTable: "blogpost",
    //模板目录
    templateDir: "./template",
    //服务器根目录
    root: root,
    //CDN根地址
    cdnRoot: cdnRoot,
    //Asset Manifest
    assetManifest: assetManifest
};