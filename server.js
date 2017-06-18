var express=require("express");
var app = express()
var fs = require("fs")

app.use("/resources",express.static("resources"));
app.get("(/|/homepage.html)",function(req,res){
    res.sendFile(__dirname+"/homepage.html");
})

app.listen(8000,function(){
    console.log("blog zxcchen.me is now running!!");
});
