var blogUtils = require("./utils");
var $ = require("jquery");
var config = require("../common/config");
var commonlib = require("../common/common");
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

/**
 * 渲染文章列表
 * @param {*} docs 
 */
function renderArticleList(docs){
    let articleList = $(".article_list");
    let content = window.document.createElement("div");
    content.setAttribute("class","article_list_content");
    let html = [];
    html.push("<ul>");
    for(let i=0;i<docs.length;i++){
        let datetime = commonlib.dateString(docs[i].createtime);
        html.push(`<li>
                        <a href="/blogpost?op=show&postId=${docs[i]._id}" title="${docs[i].title}            ${datetime}">
                            <section class="article_item_title"><h3>${docs[i].title}</h3></section>
                            <section class="article_item_content">${docs[i].content}</section>
                        </a>
                   </li>`);
    }
    html.push("</ul>");
    $(content).html(html.join(""));
    articleList.prepend(content);
}

blogpost.renderArticle = function(){
    if(window.blogpost){
        let rendertypes = config.RENDER_TYPE_ENUM;
        switch(window.blogpost.renderType){
            case rendertypes.RENDER_TYPE_LIST:
            renderArticleList(window.blogpost.docs);
            default:;
        }
    }
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

blogpost.submitArticleEditor = function(){
    $("#blogpost_form").submit();
}