var express=require("express");
var server = express();
var fs = require("fs");
var bodyparser = require("body-parser");
var cookieparser = require("cookie-parser");
var util = require("./utils");
var db = require("./db");
var sessionManager = require("./session");
var config = require("./site.config");

db.globalInit();

//设置静态资源路由
server.use("/resources",express.static("resources"));

//设置主页路由
server.get("(/|/homepage|/index\)(.html)?",function(req,res){
    res.sendFile(__dirname+"/homepage.html");
});

//设置bodyparser
server.use(bodyparser.json());
server.use(bodyparser.urlencoded({extended:false}));

//设置cookie parser
server.use(cookieparser());

//设置模板引擎
server.set("view engine","ejs");
server.set("views",config.templateDir);

//设置登录路由
server.all("/login",function(req,res,next){
    if(req.cookies){
        let loginCookie = req.cookies;
        console.log(loginCookie);
        if(loginCookie&&loginCookie["u"]&&sessionManager.isLogin(loginCookie["u"])){
            console.log(loginCookie["u"]," already log in ");
            res.location("/index");
            res.status(302);
            res.send();
            return;
        }
    }
    let method = req.method.toLowerCase();
    if(method === "get"){
        res.sendFile(__dirname+"/login.html");
    }else if(method === "post"){
        if(req.body && req.body.username && req.body.pwd){
            //获取用户名和密码
            let username = req.body.username;
            let password = req.body.pwd;
            //校验用户名和密码
            if(util.isUserPassOK(username,password)){
                password = util.md5(password);
                db.getUserInfo(username,password).then(function(doc){
                    if(doc.length==0){
                        res.sendFile(__dirname+"/error.html");
                    }else{
                        let result = doc[0];
                        let cookie = sessionManager.login(result._id);
                        res.cookie("u",cookie,{maxAge:24*3600000});
                        res.location("/index");
                        res.status(302);
                        res.send();
                    }
                }).catch(function(err){
                    console.log("error after db.getUserInfo,error:",err);
                    res.sendFile(__dirname+"/error.html");
                });
            }else{
                res.sendFile(__dirname+"/error.html");
            }
        }else{
            next();
        }
    }else{
        next();
    }
});

//设置博客文章接口路由
server.all("/blogpost",function(req,res,next){
    let method = req.method.toLowerCase();
    if(method==="get"){ //获取文章列表
        if(req.query){
            let op = req.query.op;
            switch(op){
                case "list":
                    db.getBlogPost({},{title:true,time:true,type:true},10).then(function(result){
                        let renderObject = {renderType:0,docs:result};
                        res.render("blogpost",{blogPost:JSON.stringify(renderObject)});
                    }).catch(function(err){
                        console.log(err);
                        next();
                    });
                break;
                case "show":
                    {
                        let id = req.query.postId;
                        db.getBlogPost({_id:id,type:type},{title:true,time:true,type:true,content:true},1).then(function(result){
                            let renderObject = {renderType:1,docs:result};
                            res.render("blogpost",{blogPost:JSON.stringify(renderObject)});
                        }).catch(function(err){
                            console.log(err);
                            next();
                        })
                    }
                default:
                    next();
            }
        }
    }else if(method === "post"){ //更新文章
        let id = req.query.blogPostId;
        let title = req.query.title;
        let time = parseInt(new Date().getTime()/1000);
        let content = req.query.content;
        if(id){//已有文章,进行更新
            db.updateBlogPost(id,{title:title,time:time,content:content}).then(function(result){
                if(result.modifiedCount<=0){
                    console.warn("no update on blogpost id "+id);
                    next();
                }else{
                    res.location("/blogpost?op=show&postId="+id);
                    res.send();
                }
            }).catch(function(err){
                next();
            });
        }else{//新增文章
            db.newBlogPost({title:title,time:time,content:content}).then(function(result){
                if(result.insertedCount>0){
                    res.location("/blogpost?op=show&postId="+result.insertedId);
                    res.send();
                }else{
                    console.warn("failed to insert blogpost");
                    next();
                }
            }).catch(function(err){
                next();
            });
        }
    }else{
        next();
    }
});

//设置默认路由
server.all("/*",function(req,res){
    res.status(404);
    res.sendFile(__dirname+"/404.html");
});

var _server = server.listen(9000,function(){
    console.log("blog zxcchen.me is now running!!");
});

var released = false;

function exitReleaseResource(){
    if(!released){
        released = true;
        console.log("server exit,release resources...");
        _server.close();
        db.globalRelease();
    }
}

process.on("SIGINT",exitReleaseResource);
process.on("SIGTERM",exitReleaseResource);
process.on("exit",exitReleaseResource);
process.on("uncaughtException",function(err){
    console.log("server is about to leave due to error:",err);
    process.exit(-1);
});