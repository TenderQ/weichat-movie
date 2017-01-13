'use strict'

var crypto = require('crypto');

var createNonce = function(){
	return Math.random().toString(36).substr(2,15);
}
var createTimestamp = function(){
	return parseInt(new Date().getTime() / 1000,10) + '';
}
var _sign = function(noncestr,ticket,timestamp,url){
	var params = [
		'noncestr=' + noncestr,
		'jsapi_ticket=' + ticket,
		'timestamp=' + timestamp,
		'url=' + url
	];
	var str = params.sort().join('&');
	var shasum = crypto.createHash('sha1');

	shasum.update(str);
	return shasum.digest('hex');
}
function sign(ticket,url){
	var noncestr = createNonce();
	var timestamp = createTimestamp();
	var signature = _sign(noncestr,ticket,timestamp,url);

	return {
		noncestr: noncestr,
		timestamp: timestamp,
		signature: signature
	}
}
module.exports = sign;
