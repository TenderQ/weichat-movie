'use strict'
var wxUtil = require('../../weChat/wxUtil');
var wechat = require('../../weChat/G');
var wx = require('../../weChat/index')

exports.hear = function *(next){
	this.middle = wechat(wx.options.wechat,wxUtil.reply);
	yield this.middle(next);
}
