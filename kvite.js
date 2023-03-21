// Koa
const Koa = require("koa")
// 创建实例
const app = new Koa()
const fs = require("fs")
const path = require("path")
const compilerSFC = require("@vue/compiler-sfc")
const compilerDOM = require("@vue/compiler-dom")

// 中间件配置
// 处理路由
app.use(async ctx => {
    const { url, query } = ctx.request
    // 首页请求
    if (url === "/") {
        // 加载index.html
        ctx.type = "text/html"
        ctx.body = fs.readFileSync("./src/index.html", "utf-8")
    } else if (url.endsWith(".js")) {
        // 加载js文件
        const p = path.join(__dirname, url)
        ctx.type = "application/javascript"
        ctx.body = rewriteImport(fs.readFileSync(p, "utf-8")) 
    } else if (url.startsWith("/@modules")) {
        // 裸模块名称
        const moduleName = url.replace("/@modules/", "")
        // 去node_modules目录中寻找
        const prefix = path.join(__dirname, "./node_modules", moduleName)
        // 去package.json中获取module字段
        const module = require(prefix + "/package.json").module
        const filePath = path.join(prefix, module)
        const ret = fs.readFileSync(filePath, "utf-8")
        ctx.type = "application/javascript"
        ctx.body = rewriteImport(ret)
    } else if (url.indexOf(".vue") > -1) {
        // SFC请求
        const p = path.join(__dirname, url.split("?")[0])
        const ret = compilerSFC.parse(fs.readFileSync(p, "utf-8"))
        if(!query.type) {
            // 读取vue文件并解析为js
            // 获取脚本部分内容
            const scriptContent = ret.descriptor.script.content        
            // 替换默认导出为一个常量, 方便后续修改
            const script = scriptContent.replace("export default ", "const __script = ")
            ctx.type = "application/javascript"
            ctx.body = `
                ${rewriteImport(script)}
                // 解析tpl
                import { render as __render } from "${url}?type=template"
                __script.render = __render
                export default __script
            `
        } else if (query.type === "template") {
            // 获取SFC的template内容
            const tpl = ret.descriptor.template.content
            // 将模板编译为有render函数的js文件
            const render = compilerDOM.compile(tpl, {mode: "module"}).code
            ctx.type = "application/javascript"
            ctx.body = rewriteImport(render)
        }
        
    }
})

// 裸模块地址重写
// import xx from "vue"
// import xx from "/node_modules/vue"
function rewriteImport(content) {
    return content.replace(/ from ['"](.*)['"]/g, function(match, s1) {
        // 如果第一个括号（s1）中的内容已经是相对地址, 则直接返回匹配的子串, 不进行替换
        if(s1.startsWith("./") || s1.startsWith("/") || s1.startsWith("../")) {
            return match
        } else { 
            // 裸模块替换
            return ` from "/@modules/${s1}"`
        }
    })
}

// 监听端口
app.listen(3000, () => {
    console.log("Koa server is listening on 3000")
})