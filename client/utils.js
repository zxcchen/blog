var utils = require("util");
var blogUtils = exports = module.exports = {};


blogUtils.DateString = function (timestampSec) {
    var d = new Date(timestamp * 1000);
    return utils.format("%4d-%2d-%2d %2d:%2d:%2d", d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
}