//实现客户端逻辑
var utils = require("./utils");
var blogpost = require("./blogpost");
var $ = require("jquery");

var startupRenderList = [];

$(function () {
    if(this){//window
        this.app = main;
        this.appUtil = utils;
        this.appBlogPost = blogpost;
    }
    for (let fn of startupRenderList) {
        fn();
    }
});

var main = module = module.exports = {
    addRender: function (fn) {
        startupRenderList.push(fn);
        console.log("new render callback");
    }
}