const path = require("path");
const fs = require("fs");
const commonConfig = require("../common/config");
const PROD = process.env.NODE_ENV === "production";

let cdnRoot = PROD ? "deploy/prod" : "deploy/dev";
let root = path.resolve("./");

//获取当前前端代码各文件的版本号的manifest，此文件由gulp生成
const CSS_MANIFEST_FILENAME = "css-manifest.json";
const cssManifestPath = path.join(root, cdnRoot, CSS_MANIFEST_FILENAME);
const cssManifest = require(cssManifestPath);
const JS_MANIFEST_FILENAME = "script-manifest.json";
const jsManifestPath = path.join(root, cdnRoot, JS_MANIFEST_FILENAME);
const jsManifest = require(jsManifestPath);

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

let assetManifest = buildManifest(buildManifest({
    cdnLocation: "/" + cdnRoot
}, "css", cssManifest), "js", jsManifest);


function rebuildAssetManifest() {
    let promises = [];
    let manifest = {
        cdnLocation: "/" + cdnRoot
    };
    promises.push(new Promise(function (resolve, reject) {
        fs.readFile(cssManifestPath, function (err, content) {
            if (!err) {
                let jsonInfo = JSON.parse(content);
                manifest = buildManifest(manifest, "css", jsonInfo);
                siteConfig.assetManifest["css"] = manifest["css"];
                assetManifest = manifest;
            }else{
		console.log(err);
	    }
            resolve();
        });
    }));
    promises.push(new Promise(function (resolve, reject) {
        fs.readFile(jsManifestPath, function (err, content) {
            if (!err) {
                let jsonInfo = JSON.parse(content);
                manifest = buildManifest(manifest, "js", jsonInfo);
                siteConfig.assetManifest["js"] = manifest["js"];
                assetManifest = manifest;
            }else{
		console.log(err);
	    }
            resolve();
        });
    }));
    return Promise.all(promises).then(function(){
        return siteConfig.assetManifest;
    });
}



var siteConfig = module.exports = {
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
    //css manifest 文件
    CSS_MANIFEST_FILENAME: CSS_MANIFEST_FILENAME,
    //js manifest 文件
    JS_MANIFEST_FILENAME: JS_MANIFEST_FILENAME,
    //Asset Manifest
    assetManifest: assetManifest,
    //文章栏目类型
    blogPostTypes: commonConfig.BLOG_POST_TYPES,
    //重建版本信息方法
    rebuildAssetManifest: rebuildAssetManifest,
    // hostname
    hostname:"zxcchen.me:9000"
};
