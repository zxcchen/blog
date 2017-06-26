var express = require("express");
var server = express();
var fs = require("fs");
var path = require("path");
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var util = require("./utils");
var db = require("./db");
var commonlib = require("../common/common");
var sessionManager = require("./session");
var config = require("./site.config");
var cacheManager = require("./cache");

//常量
const HOUR_SECOND = 3600;
const DAY_SECOND = 24 * 3600;
const WEEK_SECOND = 7 * DAY_SECOND;
const CACHEKEY_MENU_LIST = "menulist";
const CACHEKEY_ARTICLE_TITLELIST = "articlelist";

//初始化缓存
db.globalInit().then(function () {
    //目录
    db.getMultiBlogList().then(function (result) {
        cacheManager.set(CACHEKEY_MENU_LIST, result, HOUR_SECOND, function (cb) {
            db.getMultiBlogList().then(function (result) {
                cb(result);
            }).catch(function (err) {});
        });
    });
    //全部文章列表
    db.getBlogPost({}, {
        _id: true,
        title: true,
        createtime: true
    }, 0, 0).then(function (result) {
        result.reverse();
        cacheManager.set(CACHEKEY_ARTICLE_TITLELIST, result, HOUR_SECOND, function (cb) {
            db.getBlogPost({}, {
                _id: true,
                title: true,
                createtime: true
            }, 0, 0).then(function (result) {
                result.reverse();
                cb(result);
            }).catch(function (err) {});
        });
    });
});

const SERVER_ROOT = config.root;
console.log("serving " + SERVER_ROOT);

let assetManifest = config.assetManifest;

//添加资源版本侦听器
let assetWatcher = fs.watch(config.cdnRoot,function(evt,filename){
    if(filename == config.CSS_MANIFEST_FILENAME || filename == config.JS_MANIFEST_FILENAME){
        config.rebuildAssetManifest().then(function(manifest){
            assetManifest = manifest;
            //console.log(assetManifest);
        })
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
server.use(bodyparser.json());
server.use(bodyparser.urlencoded({
    extended: false
}));

//设置cookie parser
server.use(cookieparser());

//设置模板引擎
server.set("view engine", "ejs");
server.set("views", config.templateDir);

function showeditor(blogPostId, title, content, articleType) {
    let typeSelect = "";
    for (let type in config.blogPostTypes) {
        let name = config.blogPostTypes[type];
        let selected = type == articleType ? "selected" : "";
        typeSelect += `<option value=${type} ${selected}>${name}</option>`;
    }
    let editorContent = `
    <script type="text/javascript" src="/resources/js/tinymce/tinymce.min.js"></script>
    <form id="blogpost_form" action="/blogpost" method="post">
        <input type="hidden" name="blogPostId" value="${blogPostId}">
        <span>标题:</span><input name="title" type="text" value="${title}" style="width:200px"></input>
        <span>栏目:</span><select name="type"><option>${typeSelect}</select>
        <textarea name="content" id="blogpost_editor_textarea">${content}</textarea>
        <input type="submit" value="提交"></input>
    </form>
    <script type="text/javascript">
        tinymce.init({
            selector : '#blogpost_editor_textarea',
            height : 800,
            menubar : true,
            plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table contextmenu paste code'
            ],
            cleanup_on_startup: false,
            trim_span_elements: false,
            verify_html: false,
            cleanup: false,
            toolbar : 'undo redo | insert | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
            content_css:['//www.tinymce.com/css/codepen.min.css']
        });
    </script>
    `;
    return editorContent;
}

function showarticle(blogPostId, title, content, isAdmin) {
    let article = `
    <div id="article_content">
        <h2>${title}</h2>
        ${content}
    </div>
    ${ isAdmin?'<button><a href="/blogpost?op=edit&postId='+blogPostId+'">编辑</a></button>'+' <button><a href="/blogpost?op=remove&postId='+blogPostId+'">删除</a></button>':""}
    `;
    return article;
}

function showarticlelist(articleList) {
    let article = "<div><ul>";
    for (let i = 0; i < articleList.length; i++) {
        let title = articleList[i].title;
        let id = articleList[i]._id;
        let createTime = commonlib.dateString(articleList[i].createtime);
        article += `<li><a href="/blogpost?op=show&postId=${id}">${title}</a>.............${createTime}</li>`;
    }
    article += "</ul></div>";
    return article;
}

function renderPage(res, template, obj) {
    if (!obj) {
        obj = {};
    }
    if (!obj.assetManifest) {
        obj.assetManifest = assetManifest;
    }
    if (!obj.menuList) {
        obj.menuList = JSON.stringify(cacheManager.get(CACHEKEY_MENU_LIST));
    }
    res.render(template, obj);
}

function renderErrorPage(res, message) {
    renderPage(res, "error", {
        errorMessage: message,
        assetManifest: assetManifest
    });
}

//设置主页路由
server.get("(/|/homepage|/index\)(.html)?", function (req, res) {
    renderPage(res, "index");
});

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
    try {
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
                            let limit = req.query.limit || 100;
                            limit = limit < 0 ? 100 : limit;
                            let filter = {};
                            if (req.query.type) {
                                filter.type = parseInt(req.query.type);
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
                                    editorcontent: showarticlelist(result)
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
                            let isAdmin = sessionManager.isLogin(req.cookies["u"]);
                            let id = req.query.postId;
                            if (id) { //存在文章ID，说明是查看某个文章的请求或加载某个文章修改页面的请求
                                db.getBlogPost({
                                    _id: id
                                }, {
                                    title: true,
                                    time: true,
                                    type: true,
                                    content: true,
                                    createtime: true
                                }, 0, 1).then(function (result) {
                                    let renderObject = {
                                        renderType: renderTypeDict[op],
                                        docs: result,
                                    };
                                    let param = {};
                                    if (result.length >= 1) {
                                        let articleCacheList = cacheManager.get(CACHEKEY_ARTICLE_TITLELIST);
                                        let prevnextInfo = util.articleListBeforeNext(articleCacheList, result[0].createtime, id);
                                        renderObject.pageInfo = prevnextInfo;
                                        if (isAdmin && renderTypeDict[op] == RENDER_TYPE_EDIT_ARTICLE) {
                                            param["editorcontent"] = showeditor(result[0]._id, result[0].title, result[0].content, result[0].type);
                                        } else {
                                            param["editorcontent"] = showarticle(result[0]._id, result[0].title, result[0].content, isAdmin);
                                        }
                                    }
                                    param.blogPost = JSON.stringify(renderObject);
                                    renderPage(res, "blogpost", param);
                                }).catch(function (err) {
                                    console.log(err);
                                    renderErrorPage(res, "无法显示该文章!");
                                })
                            } else if (isAdmin) { //编辑一个新增的文章
                                renderPage(res, "blogpost", {
                                    blogPost: JSON.stringify({
                                        renderType: renderTypeDict[op],
                                        doc: []
                                    }),
                                    editorcontent: showeditor("", "", "")
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
                                        renderErrorPage(res, "更新文章失败!");
                                    } else {
                                        res.location("/blogpost?op=list");
                                        res.status(302);
                                        res.send();
                                    }
                                }).catch(function (err) {
                                    console.warn(err);
                                    renderErrorPage(res, "服务器提了一个问题。。。");
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
                renderErrorPage(res, "别瞎搞了~");
                return;
            }
            let id = req.body.blogPostId;
            let title = req.body.title;
            let time = parseInt(new Date().getTime() / 1000);
            let content = req.body.content;
            let type = parseInt(req.body.type);
            if (id && id.length > 0) { //已有文章,进行更新
                db.updateBlogPost(id, {
                    title: title,
                    time: time,
                    content: content,
                    type: type
                }).then(function (result) {
                    if (result.modifiedCount <= 0) {
                        console.warn("no update on blogpost id " + id);
                        renderErrorPage(res, "更新文章失败!");
                    } else {
                        res.status(302);
                        res.location("/blogpost?op=show&postId=" + id);
                        res.send();
                    }
                }).catch(function (err) {
                    console.warn(err);
                    renderErrorPage(res, "服务器提了一个问题。。。");
                });
            } else if (title && content && type>=0) { //新增文章
                db.newBlogPost({
                    title: title,
                    time: time,
                    content: content,
                    type: parseInt(type),
                    createtime: time
                }).then(function (result) {
                    if (result.insertedCount > 0) {
                        res.location("/blogpost?op=show&postId=" + result.insertedId);
                        res.status(302);
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
    } catch (error) {
        renderErrorPage(res, "服务器提了一个问题。。。");
    }
});

//设置默认路由
server.all("/*", function (req, res) {
    res.status(404);
    renderPage(res, "404", {});
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