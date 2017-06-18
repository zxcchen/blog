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

//设置登录路由
server.all("/login",function(req,res,next){
    let method = req.method.toLowerCase();
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
server.all("/blogpost",function(req,res){
    res.send("under development,please wait...");
});

//设置默认路由
server.all("/*",function(req,res){
    res.sendFile(__dirname+"/404.html");
});

server.listen(9000,function(){
    console.log("blog zxcchen.me is now running!!");
});

function exitReleaseResource(){
    console.log("server exit,release resources...");
    db.globalRelease();
}

//process.on("SIGINT",exitReleaseResource);
//process.on("SIGTERM",exitReleaseResource);
process.on("exit",exitReleaseResource);
process.on("uncaughtException",function(err){
    console.log("server is about to leave due to error:",err);
    process.exit(-1);
});