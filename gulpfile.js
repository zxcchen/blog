var gulp = require("gulp");
var minifyCSS = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
var path = require("path");
var webpack = require("webpack-stream");
var del = require("del");
var runsequence = require("run-sequence");
var hash = require("gulp-hash");
var gulpIf = require("gulp-if");
var fs = require("fs");


var PROD = process.env.NODE_ENV == "production" ? true : false;

var deployFolder = PROD ? "./deploy/prod/" : "./deploy/dev/";

gulp.task("clean", function () {
    return del(["./deploy"]);
})

gulp.task("minifycss", function () {
    if (PROD) {
        return gulp.src("./resources/css/*.css")
            .pipe(sourcemaps.init())
            .pipe(minifyCSS())
            .pipe(sourcemaps.write())
            .pipe(hash({
                algorithm: "md5",
                hashLength: 16,
                template: "<%= name %>.<%= hash %><%= ext %>"
            }))
            .pipe(gulp.dest(path.join(deployFolder, "css")))
            .pipe(hash.manifest("css-manifest.json", {
                deleteOld: true,
                sourceDir: deployFolder
            }))
            .pipe(gulp.dest(deployFolder));
    } else {
        return gulp.src("./resources/css/*.css")
            .pipe(hash({
                algorithm: "md5",
                hashLength: 16,
                template: "<%= name %>.<%= hash %><%= ext %>"
            }))
            .pipe(gulp.dest(path.join(deployFolder, "css")))
            .pipe(hash.manifest("css-manifest.json", {
                deleteOld: true,
                sourceDir: deployFolder
            }))
            .pipe(gulp.dest(deployFolder));
    }
});

gulp.task("build", function () {
    return gulp.src("./client/main.js")
        .pipe(webpack(require('./webpack.config')))
        .pipe(gulp.dest(path.join(deployFolder, "js")));
});

gulp.task("script-manifest",function(){
    return new Promise(function (resolve,reject){
        fs.readdir(path.join(deployFolder,"js"),function(err,filenames){
            if(err){
                reject(err);
            }else{
                var manifest = {};
                const extractVersionRegexp = /(.*)\.(.*)\.js$/
                for(let filename of filenames){
                    let result = extractVersionRegexp.exec(filename);
                    if(result&&result.length>2){
                        manifest[result[1]+".js"] = filename;
                    }
                }
                resolve(manifest);
            }
        });
    }).then(function(manifest){
        return new Promise(function(resolve,reject){
            fs.writeFile(path.join(deployFolder,"script-manifest.json"),JSON.stringify(manifest),function(err){
                if(err){
                    reject(err);
                }else{
                    resolve();
                }
            });
        });
    });
})


gulp.task("default", function (cb) {
    runsequence("clean", "minifycss", "build","script-manifest", cb);
});