'use strict'

var mongoose = require('mongoose')
var User = mongoose.model('User')
var Comment = mongoose.model('Comment')
var wx = require('../../weChat/index');
var sign = require('../../libs/sign');
var Movie = require('../api/movie');
var config = require('../../config');
var koa_request = require('koa-request');

exports.voice = function *(next){
	var weChatApi = wx.getWechat();
	var data = yield weChatApi.fetchAccessToken();
	var access_token = data.access_token;
	var ticketData = yield weChatApi.fetchTicket(access_token);
	var ticket = ticketData.ticket;
	var url = this.href.replace(':8000','');
	var params = sign(ticket,url);
	params.title = '语音搜电影';
	yield this.render('search_voice',params);
}

exports.find = function *(next){
	var code = this.query.code;
	var openUrl = "https://api.weixin.qq.com/sns/oauth2/access_token?appid="+config.appId+"&secret="+config.appSecret+
				"&code="+code+"&grant_type=authorization_code";
	
	var response = yield koa_request({
		url: openUrl
	});
	console.log("response: "+response.body);
	var body = JSON.parse(response.body);
	var openid = body.openid;
	var name = body.nickname;
	var user = yield User.findOne({openid:openid}).exec();
	
	if(!user){
		user = new User({
			openid:openid,
			name: name,
			password: '12345'
		});
		
		user = yield user.save();
	}
	
	this.session.user = user;
	this.state.user = user;
	
	var id = this.params.id;
	var weChatApi = wx.getWechat();
	var data = yield weChatApi.fetchAccessToken();
	var access_token = data.access_token;
	var ticketData = yield weChatApi.fetchTicket(access_token);
	var ticket = ticketData.ticket;
	var url = this.href.replace(':8000','');
	var params = sign(ticket,url);
	var movie = yield Movie.searchById(id);
	var comments = yield Comment.find({movie: id}).populate('from', 'name').populate('reply.from reply.to', 'name').exec();

	params.movie = movie;
	params.comments = comments;
	params.title = movie.title;
	yield this.render('movie',params);
}
//网页授权获取用户信息
exports.jump = function *(next){
	var movieId = this.params.id;
	var redirect = config.host + '/wx/movie/' + movieId;
	console.log("redirectUrl: "+redirect);
	var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+config.appId+
			"&redirect_uri="+redirect+"&response_type=code&scope=snsapi_userinfo&state="+movieId+"#wechat_redirect";
	this.redirect(url);
}
