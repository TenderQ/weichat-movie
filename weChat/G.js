'use strict'

var Promise = require('bluebird'),
	request = Promise.promisify(require('request'));
var sha1 = require('sha1');
var getRawBody = require('raw-body');
var xss = require('xss');// 对输入的内容做必要的安全过滤
var Wechat =  require('./wechat');
var util = require('../libs/utils');

module.exports = function(opts, handler){
	var wechat = new Wechat(opts);
	return function *(next){
		var that = this;
		var token = opts.token;
		var signature = this.query.signature;//签名
		var nonce = this.query.nonce;
		var timestamp = this.query.timestamp;//时间戳
		var echostr = this.query.echostr;
		
		var str = [token,timestamp,nonce].sort().join('');//进行字典排序
		var sha = sha1(str);

		if(this.method === 'GET'){
			if(sha === signature){//判断是否等于签名值
				this.body = echostr +'';
			} else {
				this.body = 'error';
			}
		} else if(this.method === 'POST'){
			if(sha != signature){//拦截非法的请求
				this.body = 'error';
				return false;
			}
			//通过row-body模块把this上的request对象拼装数据，最终拿到一个buffer的xml数据
			var data = yield getRawBody(this.req,{
				length: this.length,
				limit: '1mb',
				encoding: this.charset
			})

			var content = yield util.parseXMLAsync(data);
			// formatMessage 把 JSON 对象解析为扁平的 JS 对象
			var message = util.formatMessage(content.xml);
			
			this.weixin = message;

			//hander是从app.js传进来的wxUtil.reply方法，也就是回复的代码部分
			yield handler.call(this,next);

			wechat.reply.call(this);

		}
	}
}