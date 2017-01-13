'use strict'

module.exports = {
	'button':[
	{
		'name': '排行榜',
		'sub_button':[{
			'name': '热门',
			'type': 'click',
			'key' : 'movie_hot'
		},{
			'name': '冷门',
			'type': 'click',
			'key' : 'movie_cold'
		}]
	},{
		'name': '分类',
		'sub_button':[{
			'name': '喜剧',
			'type': 'click',
			'key' : 'movie_xiju'
		},{
			'name': '剧情',
			'type': 'click',
			'key' : 'movie_juqing'
		},{
			'name': '科幻',
			'type': 'click',
			'key' : 'movie_kehuan'
		}]
	},{
		'name': '帮助',
		'type': 'click',
		'key' : 'help'
	}]
}