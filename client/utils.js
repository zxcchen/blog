var commonlib = require("../common/common");
var blogUtils = exports = module.exports = {};


blogUtils.DateString = commonlib.dateString;

blogUtils.getQueryPath = function(){
    return window.location.pathname;
}