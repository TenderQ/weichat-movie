'use strict'

var Promise = require('bluebird'),
	request = Promise.promisify(require('request')),
	fs = require('fs'),
	_ = require('lodash')
var util = require('../libs/utils');
var api = require('./api');

function Wechat(opts){
	var that = this;
	this.appId = opts.appId;
	this.appSecret = opts.appSecret;
	this.getAccessToken = opts.getAccessToken;
	this.saveAccessToken = opts.saveAccessToken;
	this.getTicket = opts.getTicket;
	this.saveTicket = opts.saveTicket;

	this.fetchAccessToken();
}
//获取access_token
Wechat.prototype.fetchAccessToken = function(){
	var that = this;
	if(this.access_token && this.expires_in){
		if(this.isValidAccessToken(this)){
			return Promise.resolve(this);
		}
	}
	return this.getAccessToken().then(function(data){
		try{
			data = JSON.parse(data);
		}catch(e){
			return that.updateAccessToken(data);
		}

		if(that.isValidAccessToken(data)){
			return Promise.resolve(data);
		}else{
			return that.updateAccessToken();
		}
	}).then(function(data){
		if(data){
			that.access_token = data.access_token;
			that.expires_in = data.expires_in;
			that.saveAccessToken(data);
			return Promise.resolve(data);
		}else{
			console.log('access_token未刷新');
		}
	})
}
//票据合法性检查
Wechat.prototype.isValidAccessToken = function(data){
	if(!data || !data.access_token || !data.expires_in){
		return false;
	}
	var access_token = data.access_token;
	var expires_in = data.expires_in;
	var now = (new Date().getTime());

	if(now < expires_in){//判断是否过期
		return true;
	}else{
		return false;
	}
}
//更新票据
Wechat.prototype.updateAccessToken = function(){
	var appId = this.appId;
	var appSecret = this.appSecret;
	var url = api.accessToken + "&appid=" + appId +"&secret="+appSecret;
	
	return new Promise(function(resolve,reject){
		//向url发出请求
		request({url: url,json:true}).then(function(response){
			var data = response.body;
			var now = new Date().getTime();
			//票据提前20秒刷新
			var expires_in = now + (data.expires_in - 20) * 1000;
			data.expires_in = expires_in;

			resolve(data);
		})
	})
	
}
//获取ticket
Wechat.prototype.fetchTicket = function(accessToken){
	var that = this;

	return this.getTicket().then(function(data){
		try{
			data = JSON.parse(data);
		}catch(e){
			return that.updateTicket(accessToken);
		}

		if(that.isValidTicket(data)){
			return Promise.resolve(data);
		}else{
			return that.updateTicket(accessToken);
		}
	}).then(function(data){
		that.saveTicket(data);
		return Promise.resolve(data);
	})
}
//更新ticket
Wechat.prototype.updateTicket = function(accessToken){
	var url = api.ticket.get + "&acssess_token=" + accessToken +"&type=jsapi";
	
	return new Promise(function(resolve,reject){
		request({url: url,json:true}).then(function(response){
			var data = response.body;
			var now = new Date().getTime();
			//票据提前20秒刷新
			var expires_in = now + (data.expires_in - 20) * 1000;
			data.expires_in = expires_in;

			resolve(data);
		})
	})
	
}
//ticket合法性检查
Wechat.prototype.isValidTicket = function(data){
	if(!data || !data.ticket || !data.expires_in){
		return false;
	}
	var ticket = data.ticket;
	var expires_in = data.expires_in;
	var now = (new Date().getTime());

	if(ticket && now < expires_in){//判断是否过期
		return true;
	}else{
		return false;
	}
}
//上传素材
Wechat.prototype.uploadMaterial = function(type,material,permanent){
	var that =this;
	var form = {};
	var uploadUrl = api.temporary.upload;

	if(permanent){
		uploadUrl = api.permanent.upload;
		_.extend(form,permanent);
	}
	if(type === 'pic'){
		uploadUrl = api.permanent.uploadNewsPic;
	} 
	if(type === 'news'){
		uploadUrl = api.permanent.uploadNews;
		form = material;
	} else {
		form.media = fs.createReadStream(material);
	}
	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = uploadUrl + "access_token=" + data.access_token;
			
			if(!permanent){
				url += "&type="+type;
			} else {
				form.access_token = data.access_token;
			}
			var options = {
				method: 'POST',
				url:url,
				json:true
			}
			if(type === 'news'){
				options.body = form;
			} else{
				options.formData = form;
			}
			//向url发出请求
			request(options).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('上传失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
	
}
//获取素材
Wechat.prototype.getMaterial = function(mediaId,type,permanent){
	var that =this;
	var form = {};
	var getUrl = api.temporary.get;

	if(permanent){
		getUrl = api.permanent.get;
	}

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = getUrl + "access_token=" + data.access_token +"&media_id=" + mediaId;
			var options = {
				method: 'POST',
				url: url,
				json:true
			}
			var form = {};
			if(permanent){
				form.media_id = mediaId;
				form.access_token = data.access_token;
				options.body = form;
			} else {
				if(type === 'video'){
					url = url.replace('https://','http://');
				}
				url += '&media_id=' + mediaId;
			}

			if(type === 'news' || type === 'video'){
				request(options).then(function(response){
					var _data = response.body;
					if(_data){
						resolve(_data);
					}else{
						throw new Error('获取素材失败！');
					}
				}).catch(function(err){
					reject(err);
				})
			} else {
				resolve(url);
			}	
		})
		
	})
}
//删除素材
Wechat.prototype.delMaterial = function(mediaId){
	var that =this;
	var form = {
		media_id: mediaId
	};

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.permanent.delete + "access_token=" + data.access_token +"&media_id=" + mediaId;
			
			request({method: 'POST',url: url,body: form, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('删除失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//修改素材
Wechat.prototype.updateMaterial = function(mediaId, news){
	var that =this;
	var form = {
		media_id: mediaId
	};
	_.extend(form,news);
	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.permanent.update + "access_token=" + data.access_token +"&media_id=" + mediaId;
			
			request({method: 'POST',url: url,body: form, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('更新失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//获取素材总数
Wechat.prototype.countMaterial = function(){
	var that =this;
	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.permanent.getCount + "access_token=" + data.access_token;
			
			request({method: 'GET',url: url, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('获取素材总数失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//获取素材列表
Wechat.prototype.batchMaterial = function(options){
	var that =this;
	options.type = options.type || 'image';
	options.offset = options.offset || 0;
	options.count = options.count || 1;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.permanent.batchGet + "access_token=" + data.access_token;
			
			request({method: 'POST',url: url,body:options, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('获取素材列表失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}

//创建分组
Wechat.prototype.createGroup = function(name){
	var that =this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.group.create + "access_token=" + data.access_token;
			var form = {
				group:{
					name:name
				}
			}
			request({method: 'POST',url: url,body: form, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('创建分组失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//获取分组
Wechat.prototype.fetchGroup = function(name){
	var that =this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.group.get + "access_token=" + data.access_token;

			request({method: 'POST',url: url, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('获取分组失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//检查分组
Wechat.prototype.checkGroup = function(openid){
	var that =this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.group.check + "access_token=" + data.access_token;
			var form = {
				openid: openid
			}
			request({method: 'POST',url: url,body: form, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('检查分组失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//更新分组
Wechat.prototype.updateGroup = function(id,name){
	var that =this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.group.update + "access_token=" + data.access_token;
			var form = {
				group:{
					id: id,
					name:name
				} 
			}
			request({method: 'POST',url: url,body: form, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('检查分组失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//移动分组
Wechat.prototype.moveGroup = function(openid,to){
	var that =this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.group.move + "access_token=" + data.access_token;
			var form = {
				openid:openid,
				to_groupid: to,
			}
			request({method: 'POST',url: url,body: form, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('移动分组失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//删除分组
Wechat.prototype.delGroup = function(id){
	var that =this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.group.delete + "access_token=" + data.access_token;
			var form = {
				group:{
					id:id
				}
			};
			request({method: 'POST',url: url,body: form, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('删除分组失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//备注用户
Wechat.prototype.remarkUser = function(openid,remark){
	var that =this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.user.remark + "access_token=" + data.access_token;
			var form = {
				openid:openid,
				remark: remark
			};
			request({method: 'POST',url: url,body: form, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('备注用户失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//用户信息单个或批量获取
Wechat.prototype.getUsers = function(openIds,lang){
	var that =this;
	lang = lang || 'zh_CN';
	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var options = {
				json: true
			};
			if(_.isArray(openIds)){
				options.url = api.user.batchGet + "access_token=" + data.access_token;
				options.body = {
					user_list:openIds
				};
				options.method = 'POST';
			} else {
				options.url = api.user.fetch + "access_token=" + data.access_token + '&openid=' + openIds +'&lang=' + lang;
				options.method = 'GET';
			}
			
			request(options).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('获取用户信息失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//用户列表
Wechat.prototype.userList = function(openid){
	var that =this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.user.list + "access_token=" + data.access_token;
			
			if(openid){
				url += '&next_openid=' + openid;
			}

			request({url: url, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('获取用户列表失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//群发消息
Wechat.prototype.sendByGroup = function(type,message,groupid){
	var that = this;
	//msgType:mpnews/text/mpvideo/image/voice
	var msg = {
		filter:{},
		msgType: type
	};
	msg[type] = message;
	if(!groupid){
		msg.filter.is_to_all = true;
	} else {
		msg.filter = {
			is_to_all: false,
			group_id: groupid
		}
	}

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.mass.sendGroup + "access_token=" + data.access_token;
		
			request({method:'POST',url: url,body: msg, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('群发消息失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}

//根据openid发送消息
Wechat.prototype.sendByOpenId = function(type,message,openids){
	var that = this;
	//msgType:mpnews/text/mpvideo/image/voice
	var msg = {
		msgType: type,
		touser: openids
	};

	msg[type] = message;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.mass.sendOpenId + "access_token=" + data.access_token;
		
			request({method:'POST',url: url,body: msg, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('发送消息失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//撤回消息(发送成功半小时内的消息可以被删除)
Wechat.prototype.deleteMass = function(msgId){
	var that = this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.mass.del + "access_token=" + data.access_token;
			
			var msg = {
				msg_id:msgId
			}

			request({method:'POST',url: url,body: msg, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('撤回消息失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//预览消息
Wechat.prototype.previewMass = function(type,message,openids){
	var that = this;
	//msgType:mpnews/text/mpvideo/image/voice
	var msg = {
		msgType: type,
		touser: openids
	};

	msg[type] = message;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.mass.preview + "access_token=" + data.access_token;
		
			request({method:'POST',url: url,body: msg, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('发送预览消息失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//查看发送消息状态
Wechat.prototype.checkMass = function(msgId){
	var that = this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.mass.check + "access_token=" + data.access_token;
			
			var msg = {
				msg_id: msgId
			}

			request({method:'POST',url: url,body: msg, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('检查消息失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//创建菜单按钮
Wechat.prototype.createMenu = function(menu){
	var that = this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.menu.create + "access_token=" + data.access_token;

			request({method:'POST',url: url,body: menu, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('创建菜单失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//获取菜单按钮
Wechat.prototype.getMenu = function(){
	var that = this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.menu.get + "access_token=" + data.access_token;

			request({url: url, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('获取菜单按钮失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//删除菜单按钮
Wechat.prototype.deleteMenu = function(){
	var that = this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.menu.del + "access_token=" + data.access_token;

			request({url: url, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('删除菜单失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
	})
}
//获取自定义菜单配置按钮
Wechat.prototype.getCurrentMenu = function(){
	var that = this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.menu.current + "access_token=" + data.access_token;

			request({url: url, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('获取自定义菜单配置失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//创建二维码
Wechat.prototype.createQrcode = function(qr){
	var that = this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.qrcode.create + "access_token=" + data.access_token;

			request({method:'POST',url: url,body: qr, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('创建二维码失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//获取二维码
Wechat.prototype.showQrcode = function(ticket){
	return api.qrcode.show + 'ticket=' + encodeURI(ticket);
}
//创建短链接
Wechat.prototype.createShortUrl = function(longUrl,action){
	var that = this;

	action = action || 'long2short';

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.shortUrl.create + "access_token=" + data.access_token;

			var form = {
				action: action,
				long_url: longUrl
			}

			request({method:'POST',url: url,body: form, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('创建短链接失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
//微信语义接口
Wechat.prototype.semantic = function(semanticData){
	var that = this;

	return new Promise(function(resolve,reject){
		that.fetchAccessToken().then(function(data){
			var url = api.semanticUrl + "access_token=" + data.access_token;
			semanticData.appid = data.appID;

			request({method:'POST',url: url,body: semanticData, json:true}).then(function(response){
				var _data = response.body;
				if(_data){
					resolve(_data);
				}else{
					throw new Error('微信语义接口调用失败！');
				}
			}).catch(function(err){
				reject(err);
			})
		})
		
	})
}
Wechat.prototype.reply = function(){
	var content = this.body;
	var message = this.weixin;
	var xml = util.tpl(content,message);

	this.status = 200;
	this.type = 'application/xml';
	this.body = xml;
}
module.exports = Wechat;