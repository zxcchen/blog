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
        html.push(`<li id="${docs[i]._id}">
                        <section class="article_item_title"><h3>${docs[i].title}</h3></section>
                            <section class="article_item_content">${docs[i].content}</section>
                   </li>`);
    }
    html.push("</ul>");
    $(content).html(html.join(""));
    $(content).click(function(e){
        e = e.originalEvent;
        let li = $(e.target).parents("li");
        if(li&&li.length>0){
            console.log(li.attr("id"));
            window.location.href="/blogpost?op=show&postId="+li.attr("id");
        }
    });
    articleList.prepend(content);
}

function renderEditorTags(){
    let tags = getEditorTags();
    let spans = [];
    for(let tag of tags){
        spans.push(`<span class='old_tags'>${tag}</span>`);
    }
    spans.push('<span class="add_tags"><input id="editor_newtag" type="text" value=""/></span>');
    $("#blogpost_form .editor_tags").html(spans.join(""));
}

function getEditorTags(){
    let tags = $("#blogpost_form input[name='tags']");
    let tagsJson = tags.val();
    return new Set(JSON.parse(tagsJson.length>0?tagsJson:"[]"));
}

function setEditorTags(tagsJson){
    let tags = $("#blogpost_form input[name='tags']");   
    tags.val(JSON.stringify(Array.from(tagsJson)));
}

/**
 * 准备编辑器相关逻辑
 */
function prepareEditor(){
    renderEditorTags();
    $("#blogpost_form .add_tags").click(function(){
        let toAdd = $(this);
        let editTag = $(this).children("input#editor_newtag");
        editTag.blur(function(){
            let value = $(this).val();
            if(value.length>0){
                let newElement = document.createElement("span");
                newElement.innerText = value;
                newElement.className = "old_tags";
                $(newElement).click(function(){
                    let oldtag = $(this).text();
                    let tags = getEditorTags();
                    tags.delete(oldtag);
                    setEditorTags(tags);
                    $(this).remove();
                });
                $("#blogpost_form section.editor_tags").prepend(newElement);
                let tags = getEditorTags();
                tags.add(value);
                setEditorTags(tags);
            }
            $(this).val("");
            $(this).css("display","none");
            toAdd.addClass("add_tags");
        });
        editTag.focus();
        toAdd.removeClass("add_tags");
    });
}

blogpost.renderArticle = function(){
    if(window.blogpost){
        let rendertypes = config.RENDER_TYPE_ENUM;
        switch(window.blogpost.renderType){
            case rendertypes.RENDER_TYPE_LIST:
            renderArticleList(window.blogpost.docs);
            break;
            case rendertypes.RENDER_TYPE_EDIT_ARTICLE:
            prepareEditor();
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

