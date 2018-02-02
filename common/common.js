const numzero = ["","0", "00", "000", "0000"];

function numPadding(num, padding) {
    var numStr = parseInt(num).toString();
    if (numStr.length < padding) {
        return numzero[padding - numStr.length] + numStr;
    } else {
        return numStr;
    }
}


let commonlib = exports = module.exports = {

    /**
     * 从URL 的查询中提取对象
     */
    getUrlQueryObject : function (queryString){
        return JSON.parse("{"+encodeURI(queryString).slice(1).replace(/([a-zA-Z0-9_\+%]+)=?([a-zA-Z0-9_\+\-%]*)&*/g,"\"$1\":\"$2\",").slice(0,-1)+"}");
    },

    /**
     * 根据时间戳生成时间字符创
     */
    dateString : function (timestampSec) {
        var d = new Date(timestampSec * 1000);
        return numPadding(d.getFullYear(), 4) + "-" + numPadding(d.getMonth() + 1, 2) + "-" + numPadding(d.getDate(), 2) + " " + numPadding(d.getHours(), 2) + ":" + numPadding(d.getMinutes(), 2) + ":" + numPadding(d.getSeconds(), 2);
    },

    /**
     * 当前时间和给定时间戳相差多少天
     */
    diffDay : function(timestampSec){
        var curDate = new Date();
        curDate.setHours(0,0,0,0);
        var givenDate = new Date(timestampSec * 1000);
        givenDate.setHours(0,0,0,0);
        return (curDate.getTime()-givenDate.getTime())/3600/24/1000;
    }
};
