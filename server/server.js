var express = require("express");
var server = express();
var fs = require("fs");
var path = require("path");
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var htmlEncode = require("js-htmlencode");
var util = require("./utils");
var db = require("./db");
var commonlib = require("../common/common");
var sessionManager = require("./session");
var config = require("./site.config");
var cacheManager = require("./cache");
var frontConfig = require("../common/config");

//常量
const MINUTE_SECOND = 60;
const HOUR_SECOND = 3600;
const DAY_SECOND = 24 * 3600;
const WEEK_SECOND = 7 * DAY_SECOND;
const CACHE_UNIT_SECOND = config.prod ? MINUTE_SECOND : 1;
const CACHEKEY_MENU_LIST = "menulist";
const CACHEKEY_ARTICLE_TITLELIST = "articlelist";
const SERVER_PORT = 9000;
let domainUserMap = {};

function cacheKey(key,user){
	return !user?key:key+"_"+user;
}

//初始化缓存
function initCache(user) {
    if(typeof user != "string"){
       user = undefined;
    }
    let menuCacheKey = cacheKey(CACHEKEY_MENU_LIST,user);
    //目录
    db.getMultiBlogList(user).then(function (result) {
        cacheManager.set(menuCacheKey, result, CACHE_UNIT_SECOND * 10, function (cb) {
            db.getMultiBlogList(user).then(function (result) {
                cb(result);
            }).catch(function (err) {});
        });
    });
    let blogPostFilter = {};
    if(user){
	blogPostFilter.authorId = user;
    }
    //全部文章列表
    let articleTitleCacheKey = cacheKey(CACHEKEY_ARTICLE_TITLELIST,user);
    db.getBlogPost(blogPostFilter, {
        _id: true,
        title: true,
        createtime: true
    }, 0, 0).then(function (result) {
        result.reverse();
        cacheManager.set(articleTitleCacheKey, result, CACHE_UNIT_SECOND * 10, function (cb) {
            db.getBlogPost(blogPostFilter, {
                _id: true,
                title: true,
                createtime: true
            }, 0, 0).then(function (result) {
                result.reverse();
                cb(result);
            }).catch(function (err) {});
        });
    });

    if(user){
	    return;
    }

    db.getUserList().then(function (result){
        for(r of result){
	    let domain = frontConfig.USER_DOMAIN_MAP[r.username];
	    if(domain){
               let uId = r._id+"";
		domainUserMap[domain] = uId;
		initCache(uId);
            }
	} 
    });
}

db.globalInit().then(initCache)

const SERVER_ROOT = config.root;
console.log("serving " + SERVER_ROOT);

let assetManifest = config.assetManifest;

//添加资源版本侦听器
let assetWatcher = fs.watch(config.cdnRoot, function (evt, filename) {
    //console.log(filename," event:",evt);
    if (filename == config.CSS_MANIFEST_FILENAME || filename == config.JS_MANIFEST_FILENAME) {
        setTimeout(function () {
            config.rebuildAssetManifest().then(function (manifest) {
                assetManifest = manifest;
                console.log(assetManifest);
            })
        }, 5000);
    }
});


//设置静态资源路由
server.use("/resources", express.static("resources", {
    maxAge: WEEK_SECOND * 1000,
    "Last-Modified": true
}));
server.use(assetManifest.cdnLocation, express.static(config.cdnRoot, {
    maxAge: WEEK_SECOND * 1000,
    "Last-Modified": true
}));

//设置bodyparser
server.use(bodyparser.json({limit:'2mb'}));
server.use(bodyparser.urlencoded({
    extended: false,
    limit:'2mb'
}));

//设置cookie parser
server.use(cookieparser());

//设置模板引擎
server.set("view engine", "ejs");
server.set("views", config.templateDir);

function showeditor(blogPostId, title, content, articleType, userId, userName) {
    let typeSelect = "";
    for (let type in config.blogPostTypes) {
        let name = config.blogPostTypes[type];
        let selected = type == articleType ? "selected" : "";
        typeSelect += `<option value=${type} ${selected}>${name}</option>`;
    }
    return {
        blogPostId,title,typeSelect,userId,userName,content
    };
}

function showarticle(blogPostId, title, content, isAdmin, time = new Date().getTime()/1000, authorName = "") {
    let byAuthor = authorName && authorName.length>0? " by "+authorName : "";
    let article = `
    <div id="article_content">
        <h2 class="article_title">${title}</h2>
        ${content}
        <div class="article_time">${commonlib.dateString(time)} ${byAuthor}</div>
    </div>
    `;
    return article;
}

function showarticlelist(articleList) {
    let article = "<div class='article_list_content'><ul>";
    for (let i = 0; i < articleList.length; i++) {
        let title = articleList[i].title;
        let id = articleList[i]._id;
        let createTime = commonlib.dateString(articleList[i].createtime);
        article += `<li><a href="/blogpost?op=show&postId=${id}" title="${title}      ${createTime}">${title}</a></li>`;
    }
    article += "</ul></div>";
    return article;
}

function renderPage(res, template, obj, domainUser) {
    if (!obj) {
        obj = {};
    }
    if (!obj.assetManifest) {
        obj.assetManifest = assetManifest;
    }
    if (!obj.menuList) {
        obj.menuList = JSON.stringify(cacheManager.get(cacheKey(CACHEKEY_MENU_LIST,domainUser)));
    }
    res.render(template, obj);
}

function renderErrorPage(res, message, domainUser) {
    renderPage(res, "error", {
        errorMessage: message,
        assetManifest: assetManifest
    },domainUser);
}

//设置主页路由
server.get("(/|/homepage|/index\)(.html)?", function (req, res) {
    let domainUser = util.getDomainUser(req.hostname);
    domainUser = domainUser?domainUserMap[domainUser]:undefined;
    res.location("/blogpost?op=list");
    res.status(302);
    res.send();
});

//设置登录路由
server.all("/login", function (req, res, next) {
    if (req.cookies) {
        let loginCookie = req.cookies;
        if (loginCookie && loginCookie["u"] && sessionManager.isLogin(loginCookie["u"])) {
            console.log(loginCookie["u"], " already log in ");
            res.location("/blogpost?op=list");
            res.status(302);
            res.send();
            return;
        }
    }
    let domainUser = util.getDomainUser(req.hostname);
    domainUser = domainUser?domainUserMap[domainUser]:undefined;

    let method = req.method.toLowerCase();
    if (method === "get") {
        renderPage(res, "login", {
            assetManifest: assetManifest
        });
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
                        renderErrorPage(res, "用户名不存在或密码错误",domainUser);
                    } else {
                        let result = doc[0];
                        let cookie = sessionManager.login(result._id,username);
                        res.cookie("u", cookie, {
                            domain:"*."+config.domain,
                            maxAge: 24 * 3600000
                        });
                        let userDomain = frontConfig.USER_DOMAIN_MAP[username];
                        let host = userDomain && "http://"+userDomain +"."+config.hostname || "";
                        res.location(host+"/blogpost?op=list");
                        res.status(302);
                        res.send();
                    }
                }).catch(function (err) {
                    console.log("error after db.getUserInfo,error:", err);
                    renderErrorPage(res, "登录失败", domainUser);
                });
            } else {
                renderErrorPage(res, "用户名密码非法", domainUser);
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
    let domainUser = util.getDomainUser(req.hostname);
    domainUser = domainUser?domainUserMap[domainUser]:undefined;
    try {
        const RENDER_TYPE_LIST = 0;
        const RENDER_TYPE_SHOW_ARTICLE = 1;
        const RENDER_TYPE_EDIT_ARTICLE = 2;
        const renderTypeDict = {
            list: RENDER_TYPE_LIST,
            show: RENDER_TYPE_SHOW_ARTICLE,
            edit: RENDER_TYPE_EDIT_ARTICLE
        };
        let isAdmin = sessionManager.isLogin(req.cookies["u"]);
        let method = req.method.toLowerCase();
        if (method === "get") { //获取文章列表
            if (req.query) {
                let op = req.query.op;
                switch (op) {
                    case "list":
                        {
                            let start = req.query.begin && parseInt(req.query.begin) || 0;
                            start = start < 0 ? 0 : start;
                            let limit = req.query.limit && parseInt(req.query.limit) || frontConfig.BLOG_POST_ARTICLES;
                            limit = limit < 0 ? frontConfig.BLOG_POST_ARTICLES : limit;
                            let filter = {};
                            if (req.query.type) {
                                filter.type = parseInt(req.query.type);
                            }
                            if (domainUser){
                                filter.authorId = domainUser;
                            }
                            db.getBlogPost(filter, {
                                title: true,
                                time: true,
                                type: true,
                                createtime: true
                            }, start, limit).then(function (result) {
                                let renderObject = {
                                    renderType: renderTypeDict[op],
                                    docs: result
                                };
                                renderPage(res, "blogpost", {
                                    blogPost: JSON.stringify(renderObject),
                                    articlecontent: showarticlelist(result),
                                    isAdmin : isAdmin
                                },domainUser);
                            }).catch(function (err) {
                                console.log(err);
                                renderErrorPage(res, "无法获取文章列表,程序出错。。。", domainUser);
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
                                    content: true,
                                    createtime: true,
                                    authorId: true,
                                    authorName: true
                                }, 0, 1).then(function (result) {
                                    let renderDoc = {};
                                    if (result.length >= 0) {
                                        for (let r of result) {
                                            renderDoc.title = r.title;
                                            renderDoc.time = r.time;
                                            renderDoc.content = htmlEncode(r.content);
                                            break;
                                        }
                                    }
                                    let renderObject = {
                                        renderType: renderTypeDict[op],
                                        docs: renderDoc,
                                    };
                                    let param = {isAdmin:isAdmin,blogPostId:id};
                                    if (result.length >= 1) {
                                        let articleCacheList = cacheManager.get(cacheKey(CACHEKEY_ARTICLE_TITLELIST,domainUser));
                                        let prevnextInfo = util.articleListBeforeNext(articleCacheList, result[0].createtime, id);
                                        renderObject.pageInfo = prevnextInfo;
                                        if (isAdmin && renderTypeDict[op] == RENDER_TYPE_EDIT_ARTICLE) {
                                            param["editorcontent"] = showeditor(result[0]._id, result[0].title, htmlEncode(result[0].content), result[0].type,result[0].authorId,result[0].authorName);
                                        } else {
                                            param["articlecontent"] = showarticle(result[0]._id, result[0].title, result[0].content, isAdmin, result[0].createtime,result[0].authorName);
                                        }
                                    }
                                    param.blogPost = JSON.stringify(renderObject);
                                    renderPage(res, "blogpost", param, domainUser);
                                }).catch(function (err) {
                                    console.log(err);
                                    renderErrorPage(res, "无法显示该文章!", domainUser);
                                })
                            } else if (isAdmin) { //编辑一个新增的文章
                                let userInfo = sessionManager.getUser(req.cookies["u"]);
                                renderPage(res, "blogpost", {
                                    blogPost: JSON.stringify({
                                        renderType: renderTypeDict[op],
                                        doc: []
                                    },domainUser),
                                    editorcontent: showeditor("", "", "","",userInfo.u,userInfo.uname)
                                });
                            } else {
                                next();
                            }
                        }
                        break;
                    case "remove":
                        {
                            let isAdmin = sessionManager.isLogin(req.cookies["u"]);
                            let id = req.query.postId;
                            if (id && isAdmin) {
                                db.removeBlogPost(id).then(function (result) {
                                    if (result.deletedCount <= 0) {
                                        console.warn("no update on blogpost id " + id);
                                        renderErrorPage(res, "更新文章失败!", domainUser);
                                    } else {
                                        res.location("/blogpost?op=list");
                                        res.status(302);
                                        res.send();
                                    }
                                }).catch(function (err) {
                                    console.warn(err);
                                    renderErrorPage(res, "服务器提了一个问题。。。",domainUser);
                                });
                            } else {
                                res.location("/blogpost?op=list");
                                res.status(302);
                                res.send();
                            }
                        }
                        break;
                    default:
                        next();
                }
            }
        } else if (method === "post") { //更新文章
            let isAdmin = sessionManager.isLogin(req.cookies["u"]);
            if (!isAdmin) {
                renderErrorPage(res, "别瞎搞了~",domainUser);
                return;
            }
            let id = req.body.blogPostId;
            let title = req.body.title;
            let time = parseInt(new Date().getTime() / 1000);
            let content = req.body.content;
            let type = parseInt(req.body.type);
            let authorId = req.body.authorId;
            let authorName = req.body.authorName;
            if (id && id.length > 0) { //已有文章,进行更新
                db.updateBlogPost(id, {
                    title: title,
                    time: time,
                    content: content,
                    type: type
                }).then(function (result) {
                    if (result.modifiedCount <= 0) {
                        console.warn("no update on blogpost id " + id);
                        renderErrorPage(res, "更新文章失败!",domainUser);
                    } else {
                        res.status(302);
                        res.location("/blogpost?op=show&postId=" + id);
                        res.send();
                    }
                }).catch(function (err) {
                    console.warn(err);
                    renderErrorPage(res, "服务器提了一个问题。。。",domainUser);
                });
            } else if (title.length>0 && content.length>=0 && type >= 0) { //新增文章
                db.newBlogPost({
                    title: title,
                    time: time,
                    content: content,
                    type: parseInt(type),
                    createtime: time,
                    authorId:authorId,
                    authorName:authorName
                }).then(function (result) {
                    if (result.insertedCount > 0) {
                        res.location("/blogpost?op=show&postId=" + result.insertedId);
                        res.status(302);
                        res.send();
                    } else {
                        console.warn("failed to insert blogpost");
                        renderErrorPage(res, "新增文章失败",domainUser);
                    }
                }).catch(function (err) {
                    console.warn(err);
                    renderErrorPage(res, "服务器提了一个问题。。。",domainUser);
                });
            } else {
                next();
            }
        } else {
            next();
        }
    } catch (error) {
        renderErrorPage(res, "服务器提了一个问题。。。",domainUser);
    }
});

//设置默认路由
server.all("/*", function (req, res) {
    res.status(404);
    renderPage(res, "404", {});
});

var _server = server.listen(SERVER_PORT, function () {
    console.log("blog zxcchen.me is now running!!");
});

var released = false;

function exitReleaseResource() {
    if (!released) {
        released = true;
        console.log("server exit,release resources...");
        _server.close();
        assetWatcher.close();
        db.globalRelease();
    }
}

process.on("SIGINT", exitReleaseResource);
process.on("SIGTERM", exitReleaseResource);
process.on("SIGQUIT", exitReleaseResource);
process.on("SIGHUP", exitReleaseResource);
process.on("exit", exitReleaseResource);
process.on("uncaughtException", function (err) {
    console.log("server is about to leave due to error:", err);
    process.exit(-1);
});
