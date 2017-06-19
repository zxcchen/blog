
var mongodb = require("mongodb");
var mongodbClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectID;
var assert = require("assert");
var config = require("./site.config");

var db = exports = module.exports = {};

const mongodbUrl = config.dbUrl;
const userTable = config.dbUserTable;
const blogTable = config.dbBlogTable;
var conn = null;

db.globalInit = function(){
    const mongoOpts = {
        autoReconnect:true,
        reconnectInterval:1
    };
    var dbOkPromise = new Promise(function(resolve,reject){
        mongodbClient.connect(mongodbUrl, mongoOpts, function(err, db) {
            if(err!=null){
                console.error("failed to connect to mongodb with url:"+mongodbUrl);
                reject();
                return;
            }
            conn = db;
            resolve(conn);
        });
    });
    return dbOkPromise;
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
    var collection = conn.collection(userTable);
    var result = collection.find({username:username,password:password}).limit(1).toArray().catch(function(e){db.globalInit();throw e;});
    return result;
}

db.getBlogPost = function(options,toShow,limit){
    assert.notEqual(conn,null);
    if(!options){
        options = {};
    }else{
        if(options._id){
            options._id = new ObjectId(options._id);
        }
    }
    if(!toShow){
        toShow = {};
    }
    if(!limit){
        limit = 10;
    }
    var collection = conn.collection(blogTable);
    return collection.find(options,toShow).limit(limit).toArray().catch(function(e){db.globalInit();console.log("here");throw e;});    
}

db.newBlogPost = function(post){
    assert.notEqual(conn,null);
    assert.notEqual(post,null);
    return conn.collection(blogTable).insertOne(post).catch(function(e){db.globalInit();throw e;});   
}

db.updateBlogPost = function(id,post){
    assert.notEqual(conn,null);
    assert.notEqual(post,null);
    return conn.collection(blogTable).updateOne({_id:new ObjectId(id)},{$set:post}).catch(function(e){db.globalInit();throw e;})
}

if(require.main===module){
    db.globalInit().then(function(){
        db.getBlogPost({},{title:true,time:true},10).then(function(result){
            console.log(result);
        });
        db.newBlogPost({title:"html5新特性",time:parseInt(new Date().getTime()/1000),content:"<p>待续。。。</p>"}).then(function(result){
            console.log(result);
        });
        // db.updateBlogPost("594736798f924c6c0b110453",{title:"mongodb大小坑一览",content:"<p>待续。。。</p>"+Math.random()}).then(function(result){
            
        // });
        db.globalRelease();
    });
}