
var debug = require("debug")("blog:utils");
var crypto = require("crypto");
var assert = require("assert");

const validUserName = /[a-zA-Z0-9_]{3,12}/;
const validPassword = /[a-zA-Z0-9_\*\.\+]{9,12}/;

/**
 * 判断用户名密码是否符合规定
 * @param {用户名} username 
 * @param {密码} password 
 */
function isUserPassOK(username,password){
    return username && password && validUserName.exec(username)!=null && validPassword.exec(password)!=null;
}

function md5(input){
    assert.notEqual(input,undefined,"md5 input should not be falsy");
    var md5Hasher = crypto.createHash("md5");
    return md5Hasher.update(input).digest('hex').toUpperCase();
}


module.exports = {
    isUserPassOK: isUserPassOK,
    md5:md5
}


if(require.main === module){
    const testCases = [
        ["woodlgz","12341342a"],
        ["+sdfw","abcdser*wyz"],
        ["xyz","_1314erddd"],
        ["xyz1234","asdfqre*+ssd"]
    ];
    for([username,password] of testCases){
        debug("username:%s password:%s,verify:%s\n",username,password,isUserPassOK(username,password));
    }
}