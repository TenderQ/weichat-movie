'use strict'

var path = require('path');
var weChat = require('./wechat');
var util = require('../libs/utils');
var config = require('../config.json');

var wechat_file = path.join(__dirname,'../config/accessTokenFile.txt');
var wechat_ticket_file = path.join(__dirname,'../config/ticketFile.txt');

var options = {
	wechat:{
		appId: config.appId,
		appSecret: config.appSecret,
		token: config.token,
		getAccessToken: function(){
			return util.readFileAsync(wechat_file);
		},
		saveAccessToken:function(data){
			data = JSON.stringify(data);
			return util.writeFileAsync(wechat_file,data);
		},
		getTicket: function(){
			return util.readFileAsync(wechat_ticket_file);
		},
		saveTicket:function(data){
			data = JSON.stringify(data);
			return util.writeFileAsync(wechat_ticket_file,data);
		}
	}
}
exports.options = options

exports.getWechat = function(){
	var weChatApi = new weChat(options.wechat);
	
	return weChatApi;
}
