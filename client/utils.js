var commonlib = require("../common/common");
var http = require("axios");

exports = module.exports = {
    DateString : commonlib.dateString,
    getQueryPath : function(){
        return window.location.pathname+window.location.search;
    },
    confirmAction : function(msg,action){
        if(confirm(msg)){
            action();
        }
    },
    httpGet: function(url){
        return http.get(url);
    }
};