
var mogodbClient = require("mongodb").MongoClient
var assert = require("assert");
var config = require("./site.config");

var db = exports = module.exports = {};

const mongodbUrl = config.dbUrl;
var conn = null

db.globalInit = function(){
    mogodbClient.connect(mongodbUrl, function(err, db) {
        assert.equal(err,null,"failed to connect to mongodb with url:"+mongodbUrl);
        conn = db;
    });
}

db.globalRelease =  function(){
    if(conn){
        conn.close();
    }
}

db.getConn = function(){
    return conn;
}

db.getUserInfo = function(username,password){
    assert.notEqual(conn,null);
    var collection = conn.collection("user");
    var result = collection.find({username:username,password:password}).limit(1).toArray();
    return result;
}