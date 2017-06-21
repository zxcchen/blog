var express = require("express");
var server = express();
var fs = require("fs");
var path = require("path");
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var util = require("./utils");
var db = require("./db");
var sessionManager = require("./session");
var config = require("./site.config");

db.globalInit();

const SERVER_ROOT = config.root;
console.log("serving " + SERVER_ROOT);

const assetManifest = config.assetManifest;

const DAY_SECOND = 24 * 3600;
const WEEK_SECOND = 7 * DAY_SECOND;

//设置静态资源路由
server.use("/resources", express.static("resources", {
    maxAge: WEEK_SECOND * 1000,
    "Last-Modified": true
}));
server.use(assetManifest.cdnLocation, express.static(config.cdnRoot, {
    maxAge: WEEK_SECOND * 1000,
    "Last-Modified": true
}));

//设置主页路由
server.get("(/|/homepage|/index\)(.html)?", function (req, res) {
    res.render("index", assetManifest);
});

//设置bodyparser
server.use(bodyparser.json());
server.use(bodyparser.urlencoded({
    extended: false
}));

//设置cookie parser
server.use(cookieparser());

//设置模板引擎
server.set("view engine", "ejs");
server.set("views", config.templateDir);

function renderErrorPage(res, message) {
    res.render("error", Object.assign({
        errorMessage: message
    }, assetManifest));
}

function renderPage(res, template, obj) {
    if (!obj.cdnLocation) {
        obj = Object.assign(obj, assetManifest);
    }
    res.render(template, obj);
}

//设置登录路由
server.all("/login", function (req, res, next) {
    if (req.cookies) {
        let loginCookie = req.cookies;
        if (loginCookie && loginCookie["u"] && sessionManager.isLogin(loginCookie["u"])) {
            console.log(loginCookie["u"], " already log in ");
            res.location("/index");
            res.status(302);
            res.send();
            return;
        }
    }
    let method = req.method.toLowerCase();
    if (method === "get") {
        res.render("login", assetManifest);
    } else if (method === "post") {
        if (req.body && req.body.username && req.body.pwd) {
            //获取用户名和密码
            let username = req.body.username;
            let password = req.body.pwd;
            //校验用户名和密码
            if (util.isUserPassOK(username, password)) {
                password = util.md5(password);
                db.getUserInfo(username, password).then(function (doc) {
                    if (doc.length == 0) {
                        renderErrorPage(res, "用户名不存在或密码错误");
                    } else {
                        let result = doc[0];
                        let cookie = sessionManager.login(result._id);
                        res.cookie("u", cookie, {
                            maxAge: 24 * 3600000
                        });
                        res.location("/index");
                        res.status(302);
                        res.send();
                    }
                }).catch(function (err) {
                    console.log("error after db.getUserInfo,error:", err);
                    renderErrorPage(res, "登录失败");
                });
            } else {
                renderErrorPage(res, "用户名密码非法");
            }
        } else {
            next();
        }
    } else {
        next();
    }
});

//设置博客文章接口路由
server.all("/blogpost", function (req, res, next) {
    const RENDER_TYPE_LIST = 0;
    const RENDER_TYPE_SHOW_ARTICLE = 1;
    const RENDER_TYPE_EDIT_ARTICLE = 2;
    const renderTypeDict = {
        list: RENDER_TYPE_LIST,
        show: RENDER_TYPE_SHOW_ARTICLE,
        edit: RENDER_TYPE_EDIT_ARTICLE
    };
    let method = req.method.toLowerCase();
    if (method === "get") { //获取文章列表
        if (req.query) {
            let op = req.query.op;
            switch (op) {
                case "list":
                    {
                        let start = req.query.begin || 0;
                        start = start < 0 ? 0 : start;
                        let limit = req.query.limit || 10;
                        limit = limit < 0 ? 10 : limit;
                        db.getBlogPost({}, {
                            title: true,
                            time: true,
                            type: true
                        }, start, limit).then(function (result) {
                            let renderObject = {
                                renderType: renderTypeDict[op],
                                docs: result
                            };
                            renderPage(res, "blogpost", {
                                blogPost: JSON.stringify(renderObject)
                            });
                        }).catch(function (err) {
                            console.log(err);
                            renderErrorPage(res, "无法获取文章列表,程序出错。。。");
                        });
                    }
                    break;
                case "show":
                case "edit":
                    {
                        let id = req.query.postId;
                        if (id) { //存在文章ID，说明是查看某个文章的请求或加载某个文章修改页面的请求
                            db.getBlogPost({
                                _id: id
                            }, {
                                title: true,
                                time: true,
                                type: true,
                                content: true
                            }, 1).then(function (result) {
                                let renderObject = {
                                    renderType: renderTypeDict[op],
                                    docs: result
                                };
                                renderPage(res, "blogpost", {
                                    blogPost: JSON.stringify(renderObject)
                                });
                            }).catch(function (err) {
                                console.log(err);
                                renderErrorPage(res, "无法显示该文章!");
                            })
                        } else { //编辑一个新增的文章
                            renderPage(res, "blogpost", {
                                blogPost: JSON.stringify({
                                    renderType: renderTypeDict[op],
                                    doc: []
                                })
                            });
                        }
                    }
                    break;
                default:
                    next();
            }
        }
    } else if (method === "post") { //更新文章
        let id = req.query.blogPostId;
        let title = req.query.title;
        let time = parseInt(new Date().getTime() / 1000);
        let content = req.query.content;
        if (id) { //已有文章,进行更新
            db.updateBlogPost(id, {
                title: title,
                time: time,
                content: content
            }).then(function (result) {
                if (result.modifiedCount <= 0) {
                    console.warn("no update on blogpost id " + id);
                    renderErrorPage(res, "更新文章失败!");
                } else {
                    res.location("/blogpost?op=show&postId=" + id);
                    res.send();
                }
            }).catch(function (err) {
                console.warn(err);
                renderErrorPage(res, "服务器提了一个问题。。。");
            });
        } else if (title && content) { //新增文章
            db.newBlogPost({
                title: title,
                time: time,
                content: content
            }).then(function (result) {
                if (result.insertedCount > 0) {
                    res.location("/blogpost?op=show&postId=" + result.insertedId);
                    res.send();
                } else {
                    console.warn("failed to insert blogpost");
                    renderErrorPage(res, "新增文章失败");
                }
            }).catch(function (err) {
                console.warn(err);
                renderErrorPage(res, "服务器提了一个问题。。。");
            });
        } else {
            next();
        }
    } else {
        next();
    }
});

//设置默认路由
server.all("/*", function (req, res) {
    res.status(404);
    res.sendFile(SERVER_ROOT + "/404.html");
});

var _server = server.listen(9000, function () {
    console.log("blog zxcchen.me is now running!!");
});

var released = false;

function exitReleaseResource() {
    if (!released) {
        released = true;
        console.log("server exit,release resources...");
        _server.close();
        db.globalRelease();
    }
}

process.on("SIGINT", exitReleaseResource);
process.on("SIGTERM", exitReleaseResource);
process.on("exit", exitReleaseResource);
process.on("uncaughtException", function (err) {
    console.log("server is about to leave due to error:", err);
    process.exit(-1);
});