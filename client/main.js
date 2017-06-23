//实现客户端逻辑
var utils = require("./utils");
var blogpost = require("./blogpost");
var $ = require("jquery");
var bootstrap = require("bootstrap");

var startupRenderList = [];
var documentReady = false;


$(function () {
    console.log("blog init script,",new Date().getTime());
    for (let fn of startupRenderList) {
        fn();
    }
    documentReady = true;
});

var main = module = module.exports = {
    addRender : function(fn){
        if(!documentReady){
            startupRenderList.push(fn);
        }
    }
}

if(window){//window
    window.app = main;
    window.blogpost = blogpost;
    window.blogUtils = utils;
}