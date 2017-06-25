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
function isUserPassOK(username, password) {
    return username && password && validUserName.exec(username) != null && validPassword.exec(password) != null;
}

function md5(input) {
    assert.notEqual(input, undefined, "md5 input should not be falsy");
    var md5Hasher = crypto.createHash("md5");
    return md5Hasher.update(input).digest('hex').toUpperCase();
}


function currentTime() {
    return parseInt(new Date().getTime() / 1000);
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
            prev: articleList[articleList.length - 1]._id,
            next: -1
        };
    } else {
        if (articleList[idx].createtime != time) {
            return {
                prev: idx == 0 ? -1 : articleList[idx - 1]._id,
                next: articleList[idx]._id
            };
        }
        let prev = idx - 1;
        let next = idx;
        while (next < articleList.length && articleList[next]._id != currentId) {
            prev = next++;
        }
        return {
            prev: prev < 0 ? -1 : articleList[prev]._id,
            next: articleList[next == articleList.length ? -1 : next + 1]._id
        }
    }
}

module.exports = {
    isUserPassOK: isUserPassOK,
    md5: md5,
    currentTime: currentTime,
    bSearch: bSearch,
    articleListBeforeNext: articleListBeforeNext
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
}