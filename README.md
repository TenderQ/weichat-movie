# NodeJs+Koa实现电影网站微信公众号

根据慕课网实战教程[Node.js七天搞定微信公众号](http://coding.imooc.com/learn/list/38.html)动手实现

## 技术栈

1. 前端
	- PC端使用`Bootsrap`框架完成前端样式搭建;
	- 微信端使用`weUI`库搭建移动端页面样式
	- 使用`Jade`模板引擎进行模板渲染

2. 后端
	- 使用`Koa`框架实现网站后端逻辑;
	- 使用`mongodb`进行数据存储,通过`mongoose`模块完成对数据模型的操作;
	- 使用了`koa-session`实现用户数据的持久化,`koa-view`实现路由跳转
	- 使用中间件`koa-body`完成图片的上传操作
	- 使用`bluebird`库进行Promise异步操作
	- 使用`raw-body`模块拼装request对象数据,转换为xml数据 

## 文件模块

```
- app
	|- api // 电影模型的逻辑接口
	|- controllers // 模型控制器
	|- models // 存储对象模型
	|- schemas // 存储对象模式
	|- view // 视图层，存放Jade模板文件
- config
	|- router.js // 路由控制器
- libs
	|- sign.js // 微信签名生成模块
	|- tpl.js // 微信回复模板模块
	|- utils.js // 基础工具模块
- log // 日志
- public // 存储静态文件及上传文件
- weChat
	|- api.js // 微信官方接口
	|- G.js // 加载微信配置
	|- index.js // 初始化微信操作模块
	|- menu.js // 微信菜单配置
	|- wechat.js // 微信操作核心模块
	|- wxUtil.js // 微信回复逻辑
- app.js // 程序入口文件
- config.js // 配置文件
```


> config.json文件进行域名,appid,secret,token配置
