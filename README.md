# kvite

## vite 工作原理实践
Pricinples behind the vite, mini vite implementation from https://www.bilibili.com/video/BV1dh411S7Vz/

入口文件kvite.js实现了一个koa服务器来管理client请求, 根据不同的访问url进行文件读取并返回给client, 比如裸模块替换, 使用@vue/compiler-sfc和@vue/compiler-dom对.vue文件进行解析和编译render函数, 最终将SFC处理成具有render函数的对象并通过vue在页面上渲染出来。

