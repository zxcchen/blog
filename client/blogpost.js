var blogUtils = require("./utils");
var $ = require("jquery");
var blogpost = exports = module.exports = {};

function renderJqueryNote() {
    if ($("#jquery_note").get().length != 0) {
        $("#jquery_note .moreSpace tr").hide();
        $("#jquery_note .header").click(function () {
            $(this).next().next().find("tr").toggle();
        })
        $("#jquery_note tr:has(h5)").show().click(function () {
            $(this).next().toggle();
        })
        $("#jquery_note #jQuery_API").click(function () {
            $(this).next().toggle();
        })
    }
}

blogpost.renderArticle = function(){
    renderJqueryNote();
}

blogpost.deleteArticle = function(postId){
    blogUtils.confirmAction("确定删除文章？",()=>{
        blogUtils.httpGet(`/blogpost?op=remove&postId=${postId}`).then(
            ()=>{
                alert("OK!");
                window.location.href="/blogpost?op=list";
            })
        });
}