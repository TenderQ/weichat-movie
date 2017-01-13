'use strict'

var Koa = require('koa');
var crypto = require('crypto');
var mongoose = require('mongoose');
var fs = require('fs');
var views = require('koa-views');
var session = require('koa-session');
var staticServer = require('koa-static');
var bodyParser = require('koa-bodyparser');
var router = require('koa-router')();
var Wechat = require('./weChat/wechat');
var menu = require('./weChat/menu');
var wx = require('./weChat/index');
var moment = require('moment');

var dbUrl = 'mongodb://localhost/movie';
mongoose.Promise = global.Promise;
mongoose.connect(dbUrl);

//models loading
var models_path = __dirname + '/app/models';
var walk = function(path){
	fs.readdirSync(path).forEach(function(file){
		var newPath = path + '/' + file;
		var stat = fs.statSync(newPath);
		
		if(stat.isFile()){
			if(/(.*)\.(js|coffee)/.test(file)){
				require(newPath);
			} else if(stat.isDirectory){
				walk(newPath);
			}
		}
	})
}
walk(models_path);

var User = mongoose.model('User');

var weChatApi = wx.getWechat();

weChatApi.deleteMenu().then(function(){
	return weChatApi.createMenu(menu);
}).then(function(msg){
	console.log(msg);
})

var app = new Koa();

app.use(views(__dirname+'/app/views',{
	extension : 'jade',
	locals: {
		moment:moment
	}
}));

app.keys = ['movie'];
app.use(session(app));
app.use(bodyParser());
app.use(staticServer(__dirname + '/public'));
app.use(function *(next){
	var user = this.session.user;
	if(user && user._id){
		this.session.user = yield User.findOne({_id:user._id}).exec(); 
		this.state.user = this.session.user; 
	} else {
		this.state.user = null;
	}
	yield next;
})

require('./config/router')(router);

app
  .use(router.routes())
  .use(router.allowedMethods())


app.listen(8000);
console.log('成功启动服务，端口号是: 8000');