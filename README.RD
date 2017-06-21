博客系统

为了熟悉Node.js，熟悉现代前端开发使用的各种工作流工具，我开发了这个博客系统。

工程目录结构:
├── 404.html
├── README.RD
├── client
│   ├── blogpost.js
│   ├── main.js
│   └── utils.js
├── gulpfile.js
├── jsconfig.json
├── npm-debug.log
├── package.json
├── resources
│   └── css
├── server
│   ├── db.js
│   ├── server.js
│   ├── session.js
│   ├── site.config.js
│   └── utils.js
├── template
│   ├── blogpost.ejs
│   ├── error.ejs
│   ├── index.ejs
│   └── login.ejs
└── webpack.config.js

其中server为服务端代码目录，client为浏览器端代码目录，template为ejs模板文件目录，resources为资源(scss/css/images等)目录。
webpack.config.js为webpack的配置脚本，gulpfile.js为gulp的构建脚本。

开发环境构建，运行命令 npm build:dev
线上构建，运行命令 npm build:prod
构建完毕后，生成deploy目录,此为客户端需要部署的资源,由于没有专用的cdn,此目录即为cdn目录。