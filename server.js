var express=require("express");
var server = express()
var fs = require("fs")

server.use("/resources",express.static("resources"));
server.get("(/|/homepage.html)",function(req,res){
    res.sendFile(__dirname+"/homepage.html");
})

server.listen(80,function(){
    console.log("blog zxcchen.me is now running!!");
});
