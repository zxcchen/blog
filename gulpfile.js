var gulp = require("gulp");
var minifyCSS = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
var path = require("path");
var webpack = require("webpack-stream");
var del = require("del");
var runsequence = require("run-sequence");
var hash = require("gulp-hash");
var gulpIf = require("gulp-if");


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
        .pipe(gulpIf("*.js", hash({
            algorithm: "md5",
            hashLength: 16,
            template: "<%= name %>.<%= hash %><%= ext %>"
        })))
        .pipe(gulp.dest(path.join(deployFolder, "js")))
        .pipe(hash.manifest("script-manifest.json", {
            deleteOld: true,
            sourceDir: deployFolder
        }))
        .pipe(gulp.dest(deployFolder));
});


gulp.task("default", function (cb) {
    runsequence("clean", "minifycss", "build", cb);
});