const BLOG_POST_TYPE = {
    0: "编程",
    1: "生活",
    2: "项目",
    3: "数学"
};

const RENDER_TYPE_ENUM = {
    RENDER_TYPE_LIST : 0,
    RENDER_TYPE_SHOW_ARTICLE : 1,
    RENDER_TYPE_EDIT_ARTICLE : 2
}

const BLOGPOST_PAGE_ARTICLES = 5;

const DOMAIN_USER_MAP = {
    "qiqi":"qiqi",
    "lin":"xiaolin"
};

const USER_DOMAIN_MAP = Object.keys(DOMAIN_USER_MAP).reduce((m,v)=>{
    m[DOMAIN_USER_MAP[v]]=v;
    return m;
},{});

module.exports = {
    BLOG_POST_TYPES: BLOG_POST_TYPE,
    BLOG_POST_ARTICLES : BLOGPOST_PAGE_ARTICLES,
    DOMAIN_USER_MAP,
    USER_DOMAIN_MAP,
    RENDER_TYPE_ENUM
}
