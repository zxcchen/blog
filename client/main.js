//实现客户端逻辑
var utils = require("./utils");
var blogpost = require("./blogpost");
var $ = require("jquery");

var startupRenderList = [];
var documentReady = false;

$(function () {
    console.log("blog init script");
    if(window){//window
        window.app = main;
        window.appUtil = utils;
        window.appBlogPost = blogpost;
    }
    for (let fn of startupRenderList) {
        fn();
    }
    documentReady = true;
});

var main = module = module.exports = {
    addRender: function (fn) {
        if(!documentReady){
            startupRenderList.push(fn);
        }
    }
}