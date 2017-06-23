var blogUtils = exports = module.exports = {};

const numzero = ["0","00","000","0000"];

function numPadding(num, padding) {
    var numStr = parseInt(num).toString();
    if (numStr.length < padding) {
        return numzero[padding - numStr.length] + numStr;
    } else {
        return numStr;
    }
}

blogUtils.DateString = function (timestampSec) {
    var d = new Date(timestampSec * 1000);
    return numPadding(d.getFullYear(), 4) + "-" + numPadding(d.getMonth()+1, 2) + "-" + numPadding(d.getDate(), 2) + " " + numPadding(d.getHours(), 2) + ":" + numPadding(d.getMinutes(), 2) + ":" + numPadding(d.getSeconds(), 2);
}

blogUtils.getQueryPath = function(){
    return window.location.pathname;
}