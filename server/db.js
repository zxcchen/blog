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

//任何关于mongodb客户端的问题，随时查阅http://mongodb.github.io/node-mongodb-native/2.2/tutorials/connect/

db.globalInit = function () {
    const mongoOpts = {
        autoReconnect: true,
        reconnectInterval: 1
    };
    var dbOkPromise = new Promise(function (resolve, reject) {
        mongodbClient.connect(mongodbUrl, mongoOpts, function (err, db) {
            if (err != null) {
                console.error("failed to connect to mongodb with url:" + mongodbUrl);
                reject();
                return;
            }
            conn = db;
            resolve(conn);
        });
    });
    return dbOkPromise;
}

db.globalRelease = function () {
    if (conn) {
        conn.close();
    }
}

db.getConn = function () {
    return conn;
}

db.getUserInfo = function (username, password) {
    assert.notEqual(conn, null);
    var collection = conn.collection(userTable);
    var result = collection.find({
        username: username,
        password: password
    }).limit(1).toArray().catch(function (e) {
        db.globalInit();
        throw e;
    });
    return result;
}

db.getMultiBlogList = function (types, limit) {
    assert.notEqual(conn, null);
    if (!types) {
        types = Object.keys(config.blogPostTypes).sort().map(function (item) {
            return parseInt(item);
        });
    }
    if (!limit) {
        limit = 3;
    }
    let collection = conn.collection(blogTable);

    let promises = [];
    var articleList = [];
    for (let type of types) {
        promises.push(collection.find({
            type: type
        }, {
            _id: true,
            title: true,
            type: true,
            time: true
        }).sort({
            time: -1
        }).limit(limit).toArray().then(function (result) {
            for (let i = 0; i < result.length; i++) {
                articleList.push(result[i]);
            }
        }).catch(function (e) {
            db.globalInit();
            throw e;
        }));
    }

    return Promise.all(promises).then(function () {
        return articleList;
    }).catch(function (err) {
        console.log(err);
        return articleList;
    });
}

db.getBlogPost = function (options, toShow, start, limit, sortRule = {
    createtime: -1
}) {
    assert.notEqual(conn, null);
    if (!options) {
        options = {};
    } else {
        if (options._id) {
            options._id = new ObjectId(options._id);
        }
    }
    toShow = toShow || {};
    start = start || 0;
    limit = limit || 10;

    var collection = conn.collection(blogTable);
    return collection.find(options, toShow).sort(sortRule).skip(start).limit(limit).toArray().catch(function (e) {
        db.globalInit();
        throw e;
    });
}

db.newBlogPost = function (post) {
    assert.notEqual(conn, null);
    assert.notEqual(post, null);
    return conn.collection(blogTable).insertOne(post).catch(function (e) {
        db.globalInit();
        throw e;
    });
}

db.updateBlogPost = function (id, post) {
    assert.notEqual(conn, null);
    assert.notEqual(post, null);
    return conn.collection(blogTable).updateOne({
        _id: new ObjectId(id)
    }, {
        $set: post
    }).catch(function (e) {
        db.globalInit();
        throw e;
    })
}

db.removeBlogPost = function (id) {
    assert.notEqual(conn, null);
    return conn.collection(blogTable).deleteOne({
        _id : new ObjectId(id)
    });
}

if (require.main === module) {
    db.globalInit().then(function () {
        db.getBlogPost({}, {
            title: true,
            time: true
        }, 0, 0).then(function (result) {
            console.log(result);
        });
        /*db.getMultiBlogList().then(function (result) {
            for (let res of result) {
                console.log(JSON.stringify(res));
            }
        }).catch(function (err) {
            console.log(err);
        });*/
        /*db.newBlogPost({
            title: "我与小林的二三事",
            type: 3,
            time: parseInt(new Date().getTime() / 1000),
            content: "<p>待续。。。</p>",
            createtime : parseInt(new Date().getTime() / 1000)
        }).then(function (result) {
            console.log(result);
        });*/
        /*db.updateBlogPost("5947393e4caab06cf815ee85",{type:0}).then(function(result){
        });*/
        db.globalRelease();
    });
}