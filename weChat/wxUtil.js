'use strict'
var util = require('../libs/utils');
var path = require('path');
var Movie = require('../app/api/movie');

var userLog = path.join(__dirname,'../log/user.log');
var imgMaterialLog = path.join(__dirname,'../log/img-material.log');
var host = require('../config').host;

var help = '欢迎关注爱电影微信公众号!\n' +
			'回复 1 : 测试回复\n' +
			'回复 电影名字 : 查询电影信息\n' +
			'语音回复 : 查询电影信息\n' +
			'点击<a href="'+host+'/wx/movie">语音查询</a>';

exports.reply = function *(next){
	var message = this.weixin;
	if(message.MsgType === 'event'){
		if(message.Event === 'subscribe'){
			if(message.EventKey){
				var msg = util.getTime() +"   "+ message.FromUserName +"订阅了本公众号";
				util.writeFileAsync(userLog,msg);
			}
			var msg = util.getTime() +"   "+ message.FromUserName +"订阅了本公众号";
			util.addFileAsync(userLog,msg);
			this.body = help;
		} else if (message.Event === 'unsubscribe'){
			var msg = util.getTime() +"   "+ message.FromUserName +"取消订阅本公众号";
			util.addFileAsync(userLog,msg);
			this.body = '';
		} else if (message.Event === 'LOCATION'){
			this.body = '您所在的位置是：'+ message.Latitude +'/' + message.Longitude + '-' + messgae.Precision;
		} else if (message.Event === 'CLICK'){
			var news =[];
			if(message.EventKey === 'movie_hot'){
				let movies = yield Movie.findHotMovies(-1,5);
				movies.forEach(function(movie){
					news.push({
						title: movie.title,
						description: movie.title,
						picUrl: movie.poster,
						url: host + '/wx/jump/' + movie._id
					})
				})
			} else if(message.EventKey === 'movie_cold'){
				let movies = yield Movie.findHotMovies(1,5);
				movies.forEach(function(movie){
					news.push({
						title: movie.title,
						description: movie.title,
						picUrl: movie.poster,
						url: host + '/wx/jump/' + movie._id
					})
				})
			} else if(message.EventKey === 'movie_xiju'){
				let cat = yield Movie.findMoviesByCate('喜剧');
				if(cat.movies && cat.movies.length>0){
					cat.movies.forEach(function(movie){
						news.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: host + '/wx/jump/' + movie._id
						})
					})
					news = news.splice(0,5);
				} else {
					news = '该分类下暂无电影'
				}
			} else if(message.EventKey === 'movie_juqing'){
				let cat = yield Movie.findMoviesByCate('剧情');
				if(cat.movies && cat.movies.length>0){
					cat.movies.forEach(function(movie){
						news.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: host + '/wx/jump/' + movie._id
						})
					})
					news = news.splice(0,5);
				} else {
					news = '该分类下暂无电影'
				}
			} else if(message.EventKey === 'movie_kehuan'){
				let cat = yield Movie.findMoviesByCate('科幻');
				if(cat && cat.movies && cat.movies.length>0){
					cat.movies.forEach(function(movie){
						news.push({
							title: movie.title,
							description: movie.title,
							picUrl: movie.poster,
							url: host + '/wx/jump/' + movie._id
						})
					})
					news = news.splice(0,5);
				} else {
					news = '该分类下暂无电影'
				}
			} else if(message.EventKey === 'help'){
				news = help;
			}
			this.body = news;
		}
	} else if(message.MsgType === 'voice'){
		var reply = "未找到匹配的电影记录！";
		var voiceText = message.Recognition;
		var movies = yield Movie.searchByName(voiceText);
		if(!movies || movies.length === 0){
			movies = yield Movie.searchByDouban(voiceText);
		}
		if(movies && movies.length > 0){
			reply = [];
			movies = movies.slice(0,5);
			movies.forEach(function(movie){
				reply.push({
					title: movie.title,
					description: movie.title,
					picUrl: movie.poster,
					url: host + '/wx/jump/' + movie._id
				})
			})
		} else {
			reply = '没有查询到与' + content + '匹配的电影'
		}
		this.body = reply;
	} else if(message.MsgType === 'text'){
		var content = message.Content;
		var reply = "未找到匹配的回复规则！";
		if(content === '1'){
			reply = '您发的是文本信息:' + message.Content;
		} else {
			var movies = yield Movie.searchByName(content);
			if(!movies || movies.length === 0){
				movies = yield Movie.searchByDouban(content);
			}
			if(movies && movies.length > 0){
				reply = [];
				movies = movies.slice(0,5);
				
				movies.forEach(function(movie){
					reply.push({
						title: movie.title,
						description: movie.title,
						picUrl: movie.poster,
						url: host + '/wx/jump/' + movie._id
					})
				})
			} else {
				reply = '没有查询到与' + content + '匹配的电影'
			}
		}
		this.body = reply;
	}
	yield next;
}