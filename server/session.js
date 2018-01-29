
var sessions = {};

const DAY_SECOND = 3600*24;

var sessionManager=exports = module.exports;

sessionManager.sessions = sessions;

sessionManager.login = function(uid,username){
    //这里生成cookie的算法采用简单的随机数拼接，如果需要更高的安全性再重写
    var cookie = uid+Math.random();
    sessions[cookie] = {t:new Date().getTime()/1000,u:uid,uname:username};
    return cookie;
}

sessionManager.logout = function(cookie){
    if(cookie && cookie!=""){
        delete sessions[cookie];
    }
}

sessionManager.getUser = function(cookie){
    if(cookie && cookie!=""){
        return sessions[cookie];
    }
}

sessionManager.isLogin = function(cookie){
    if(cookie && cookie!=""){
        var sessionObj = sessions[cookie];
        if(typeof sessionObj == "object"){
            let currentTime = new Date().getTime()/1000;
            try{
                t = sessionObj.t;
                if(currentTime-t<=DAY_SECOND){
                    return sessionObj.u;
                }else{
                    logout(cookie);
                    return false;
                }
            }catch(err){
                console.error("在isLogin发生错误,cookie:",cookie,",error:",err);
                return false;
            }
        }
    }
}