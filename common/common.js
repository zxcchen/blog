const numzero = ["","0", "00", "000", "0000"];

function numPadding(num, padding) {
    var numStr = parseInt(num).toString();
    if (numStr.length < padding) {
        return numzero[padding - numStr.length] + numStr;
    } else {
        return numStr;
    }
}


let commonlib = exports = module.exports = {};

commonlib.getUrlQueryObject = function (queryString){
	return JSON.parse("{"+encodeURI(queryString).slice(1).replace(/([a-zA-Z0-9_\+%]+)=?([a-zA-Z0-9_\+\-%]*)&*/g,"\"$1\":\"$2\",").slice(0,-1)+"}");
}


commonlib.dateString = function (timestampSec) {
    var d = new Date(timestampSec * 1000);
    return numPadding(d.getFullYear(), 4) + "-" + numPadding(d.getMonth() + 1, 2) + "-" + numPadding(d.getDate(), 2) + " " + numPadding(d.getHours(), 2) + ":" + numPadding(d.getMinutes(), 2) + ":" + numPadding(d.getSeconds(), 2);
};
