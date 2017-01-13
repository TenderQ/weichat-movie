var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var mp_prefix = 'https://mp.weixin.qq.com/cgi-bin/';
var semanticUrl = 'https://api.weixin.qq.com/semantic/search?';
var api = {
	accessToken: prefix +'token?grant_type=client_credential',
	temporary:{//临时素材
		upload: prefix+'media/upload?',
		//media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID
		get: prefix + 'media/get?',
	},
	permanent:{//永久素材
		upload: prefix+'material/add_material?',//新增其他类型永久素材
		uploadNews: prefix + 'material/add_news?',//新增永久图文素材
		uploadNewsPic: prefix + 'material/uploadimg?',//上传图文消息内的图片
		get: prefix + 'material/get_material?',
		delete: prefix + 'material/del_material?',
		update: prefix + 'material/update_news?',
		getCount: prefix + 'material/get_materialcount?',
		batchGet: prefix + 'material/batchget_material?'
	},
	group:{
		create: prefix + 'groups/create?',
		get: prefix + 'groups/get?',
		check: prefix + 'groups/getid?',
		update: prefix + 'groups/update?',
		move: prefix + 'groups/members/update?',
		batchUpdate: prefix + 'groups/members/batchupdate?',
		delete: prefix + 'groups/delete?',
	},
	user: {
		remark: prefix + 'user/info/updateremark?',
		fetch: prefix + 'user/info?',
		batchGet: prefix + 'user/info/batchget?',
		list: prefix + 'user/get?',
	},
	mass:{
		sendGroup: prefix + 'message/mass/sendall?',
		sendOpenId: prefix + 'message/mass/send?',
		del: prefix + 'message/mass/delete?',
		preview: prefix + 'message/mass/preview?',
		check: prefix + 'message/mass/get?',
	},
	menu:{
		create: prefix + 'menu/create?',
		get: prefix + 'menu/get?',
		del: prefix + 'menu/delete?',
		current: prefix + 'get_current_selfmenu_info?',
	},
	qrcode:{
		create: prefix + 'qrcode/create?',
		show: mp_prefix + 'showqrcode?',
	},
	shortUrl:{
		create: prefix + 'shorturl?',
	},
	ticket:{
		get:  prefix + 'ticket/getticket?',
	},
	semanticUrl:semanticUrl
}
module.exports = api;