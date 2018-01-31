var debug = require("debug")("blog:utils");
var crypto = require("crypto");
var assert = require("assert");
var db = require("./db");
var fs = require("fs");
var path = require("path");

const validUserName = /[a-zA-Z0-9_]{3,12}/;
const validPassword = /[a-zA-Z0-9_\*\.\+]{8,12}/;

/**
 * 判断用户名密码是否符合规定
 * @param {用户名} username 
 * @param {密码} password 
 */
function isUserPassOK(username, password) {
    return username && password && validUserName.exec(username) != null && validPassword.exec(password) != null;
}

function md5(input) {
    assert.notEqual(input, undefined, "md5 input should not be falsy");
    var md5Hasher = crypto.createHash("md5");
    return md5Hasher.update(input).digest('hex').toUpperCase();
}


function getDomainUser(hostname){
    let host = hostname.split("\.");
    if(host.length>=1){
       return host[0];
    }
    return null;
}

function currentTime() {
    return parseInt(new Date().getTime() / 1000);
}

function extractDate(str){
    let d = new Date(str);
    return parseInt(d.getTime()/1000);
}

/**
 * 二分查找，找到第一个大于等于key的元素的位置
 * @param {排好序的正序数组} sortedArray 
 * @param {需要查找的目标} key 
 * @param {获取元素的属性值的函数} getter 
 * 查找超出边界返回-1
 */
function bSearch(sortedArray, key, getter = function (ele) {
    return ele;
}) {
    let low = 0,
        high = sortedArray.length - 1;
    while (low <= high) {
        let mid = low + ((high - low) >> 1);
        if (getter(sortedArray[mid]) < key) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    if (low >= sortedArray.length) {
        return -1;
    }
    return low;
}

function articleListBeforeNext(articleList, time, currentId) {
    let idx = bSearch(articleList, time, function (ele) {
        return ele.createtime;
    });
    if (idx < 0) {
        return {
            prev: articleList[articleList.length - 1],
            next: null
        };
    } else {
        if (articleList[idx].createtime != time) {
            return {
                prev: idx == 0 ? null : articleList[idx - 1],
                next: articleList[idx]
            };
        }
        let prev = idx - 1;
        let next = idx;
        while (next < articleList.length && articleList[next]._id != currentId) {
            prev = next++;
        }
        return {//按需求下一篇文章显示更新的文章，所以反过来
            next: prev < 0 ? null : articleList[prev],
            prev: articleList[next == articleList.length ? -1 : next + 1]
        }
    }
}

/**
 * 从本地目录中将html文章转录入数据库
 * @param {目录} dirname 
 */
function loadBlogPostToDB(fullFilename, isNew = true) {
    return new Promise(function (resolve, reject) {
        let promises = [];
        let stat = fs.statSync(fullFilename);
        if (!stat.isDirectory()) {
            let contentRegExp = /<div [\w\W]*id='content'>\W+<h1 data-type=([0-9]+) data-time="([\w\W]+)">([\w\W]+)<\/h1>([\w\W]+)<div id='btn'><span id='page_up'>上一章<\/span><span id='page_down'>下一章<\/span><\/div>\r\n\s+<\/div>/
            contentRegExp.global = true;
            contentRegExp.ignoreCase = true;
            contentRegExp.multiline = true;
            let content = fs.readFileSync(fullFilename).toString();
            let result = contentRegExp.exec(content);
            if (result && result.length > 4) {
                //console.log("filename:",fullFilename,"type:",result[1],",title:",result[2],",content:",result[3]);
                let type = parseInt(result[1]);
                let createTime = extractDate(result[2]);
                let title = result[3];
                let content = result[4];
                if (isNew) { //新文章
                    promises.push(db.newBlogPost({
                        title: title,
                        type: type,
                        time: createTime,
                        content: content,
                        createtime: createTime
                    }));
                } else { //更新文章
                    promises.push(db.updateBlogPost({
                        title: title,
                        type: type
                    }, {
                        title: title,
                        type: type,
                        time: currentTime(),
                        content: content
                    }));
                }
            } else {
                console.log("filename:", fullFilename, " failed to parse!!");
            }
            Promise.all(promises).then(function () {
                resolve();
            }, function () {
                reject();
            });
        } else {
            let dirname = fullFilename;
            fs.readdir(dirname, function (err, filenames) {
                if (err) {
                    console.log(err);
                } else {
                    for (let filename of filenames) {
                        if (filename == '.' || filename == '..') {
                            continue;
                        }
                        let fullFilename = path.join(dirname, filename);
                        promises.push(loadBlogPostToDB(fullFilename, isNew));
                    }
                }
                Promise.all(promises).then(function () {
                    resolve();
                }, function () {
                    reject();
                });
            });
        }
    });
}

module.exports = {
    isUserPassOK: isUserPassOK,
    md5: md5,
    currentTime: currentTime,
    bSearch: bSearch,
    articleListBeforeNext: articleListBeforeNext,
    getDomainUser:getDomainUser
}


if (require.main === module) {
    const testCases = [
        ["woodlgz", "12341342a"],
        ["+sdfw", "abcdser*wyz"],
        ["xyz", "_1314erddd"],
        ["xyz1234", "asdfqre*+ssd"]
    ];
    for ([username, password] of testCases) {
        debug("username:%s password:%s,verify:%s\n", username, password, isUserPassOK(username, password));
    }

    const bSearchTestCases = [{
            arr: [1, 3, 5, 6, 6, 6, 7, 7, 8],
            key: 6
        },
        {
            arr: [1, 3, 5, 6, 6, 6, 7, 7, 8],
            key: 7
        },
        {
            arr: [1, 3, 5, 6, 6, 6, 7, 7, 8],
            key: 2
        },
        {
            arr: [1, 3, 5, 6, 6, 6, 7, 7, 8],
            key: 1
        },
        {
            arr: [1, 3, 3, 6, 6, 6, 7, 7, 8],
            key: 4
        },
        {
            arr: [1, 3, 3, 6, 6, 6, 7, 7, 8],
            key: 9
        },
        {
            arr: [1, 2, 3],
            key: 2
        },
        {
            arr: [1, 2, 3],
            key: 3
        },
        {
            arr: [1, 2, 3],
            key: 1
        }
    ];
    for (let {
            arr,
            key
        } of bSearchTestCases) {
        console.log("testcase:", arr, ",key:", key, ",found:", bSearch(arr, key));
    }
    // db.globalInit().then(function () {
    //     let dirname = path.join(__dirname, "../resources/html");
    //     loadBlogPostToDB(dirname,true).then(function () {
    //         db.globalRelease();
    //     }).catch(function () {
    //         db.globalRelease();
    //     });
    // });
}
