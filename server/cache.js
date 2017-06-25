
var db = require("./db");
var utils = require("./utils");

var cache = {};

var cacheManager = exports = module.exports = {};

cacheManager.set = function(key,value,expire,cacheMissFn){
    cache[key] = {
        value:value,
        updateTime : utils.currentTime(),
        expire : expire,
        cacheMissFn : cacheMissFn
    };
}

cacheManager.update = function(key,value,expire){
    cache[key].value = value;
    cache[key].updateTime = utils.currentTime();
    cache[expire].expire = expire;
}

cacheManager.get = function(key){
    if(cache[key]){
        let cacheObj = cache[key];
        let currentTime  = utils.currentTime();
        if(cacheObj.expire&&cacheObj.expire>0&&cacheObj.updateTime+cacheObj.expire<currentTime){
            if(cacheObj.cacheMissFn){
                cacheObj.cacheMissFn.call(null,function(result){
                    cacheManager.update(key,result,cacheObj.expire);
                });
                return cacheObj.value;
            }else{
                return null;
            }
        }else{
            return cacheObj.value;
        }
    }else{
        return null;
    }
}