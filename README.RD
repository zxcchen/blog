博客系统

为了熟悉Node.js，熟悉现代前端开发使用的各种工作流工具，我开发了这个博客系统。

工程目录结构:
├── README.RD
├── client
│   ├── blogpost.js
│   ├── main.js
│   └── utils.js
├── common
│   ├── common.js
│   └── config.js
├── error.html
├── gulpfile.js
├── jsconfig.json
├── package.json
├── resources
│   ├── css
│   ├── img
│   └── js
├── server
│   ├── cache.js
│   ├── db.js
│   ├── server.js
│   ├── session.js
│   ├── site.config.js
│   └── utils.js
├── template
│   ├── 404.ejs
│   ├── blogpost.ejs
│   ├── error.ejs
│   ├── header.ejs
│   ├── index.ejs
│   ├── login.ejs
│   └── sidebar.ejs
└── webpack.config.js

其中server为服务端代码目录，client为浏览器端代码目录，common为前后端公共代码,template为ejs模板文件目录，resources为资源(scss/css/images等)目录。
webpack.config.js为webpack的配置脚本，gulpfile.js为gulp的构建脚本。

开发环境构建，运行命令 npm run-script build:dev 或 gulp
线上构建，运行命令 npm run-script build:prod 或 NODE_ENV=production gulp
构建完毕后，生成deploy目录,此为客户端需要部署的资源,由于没有专用的cdn,此目录即为cdn目录。


使用webpack之后，原来不到1k的javascript代码文件膨胀到了好几k,原因是webpack会将require的模块进行bundle，同时加入webpack模块化实现代码。说明使用npm 模块来加快客户端的开发效率将折衷部署的文件体积，webpack等打包工具只能尽可能地通过拆分代码再打包来优化部署性能。
总结就是webpack等模块化打包工具的使用场景，最好应该是项目代码足够大，有模块化可能性。
关于打包体积的优化，参考https://github.com/youngwind/blog/issues/65