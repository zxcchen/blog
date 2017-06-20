module.exports = {
    //是否是线上环境
    prod: true,
    //mongodb url
    dbUrl: "mongodb://127.0.0.1:27017/blog",
    //mongodb 用户表
    dbUserTable: "user",
    //mongodb 文章表
    dbBlogTable: "blogpost",
    //模板目录
    templateDir: "./template",
    //服务器根目录
    root: require("path").resolve("./"),
};