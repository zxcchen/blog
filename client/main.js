//实现客户端逻辑
var utils = require("./utils");
var blogpost = require("./blogpost");
var $ = require("jquery");
var bootstrap = require("bootstrap");
var config = require("../common/config");
var commonlib = require("../common/common");

var startupRenderList = [];
var documentReady = false;


$(function () {
    console.log("blog init script,",new Date().getTime());
    $("#sidebar .article ul").hide();
    $("#sidebar .article .h5").click(function(){
        $(this).next().toggle();
    });
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

window.app = main;
window.blogpost = blogpost;
window.blogUtils = utils;
window.config = config;
window.commonlib = commonlib;