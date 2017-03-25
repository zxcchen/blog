var express=require("express");
var server = express()
var fs = require("fs")

server.use(express.static("resources"));
server.get("/",function(req,res){
    res.sendFile(__dirname+"/homepage.html");
})

server.listen(80,function(){
    console.log("blog zxcchen.me is now running!!");
});