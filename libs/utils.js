'use strict'

var fs = require('fs');
var xml2js = require('xml2js');
var Promise = require('bluebird');
var tpl = require('./tpl');

exports.getTime = function(){
	var myDate = new Date();
	myDate.getYear();        //获取当前年份(2位)
	myDate.getFullYear();    //获取完整的年份(4位,1970-????)
	myDate.getMonth();       //获取当前月份(0-11,0代表1月)
	myDate.getDate();        //获取当前日(1-31)
	myDate.getDay();         //获取当前星期X(0-6,0代表星期天)
	myDate.getTime();        //获取当前时间(从1970.1.1开始的毫秒数)
	myDate.getHours();       //获取当前小时数(0-23)
	myDate.getMinutes();     //获取当前分钟数(0-59)
	myDate.getSeconds();     //获取当前秒数(0-59)
	myDate.getMilliseconds();    //获取当前毫秒数(0-999)
	// myDate.toLocaleDateString();     //获取当前日期
	// var mytime=myDate.toLocaleTimeString();     //获取当前时间
	var myTime = myDate.toLocaleString( );        //获取日期与时间
	return myTime;
}

Date.prototype.Format = function(fmt) {         
    var o = {         
    "M+" : this.getMonth()+1, //月份         
    "d+" : this.getDate(), //日         
    "h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时         
    "H+" : this.getHours(), //小时         
    "m+" : this.getMinutes(), //分         
    "s+" : this.getSeconds(), //秒         
    "q+" : Math.floor((this.getMonth()+3)/3), //季度         
    "S" : this.getMilliseconds() //毫秒         
    };         
    var week = {         
    "0" : "/u65e5",         
    "1" : "/u4e00",         
    "2" : "/u4e8c",         
    "3" : "/u4e09",         
    "4" : "/u56db",         
    "5" : "/u4e94",         
    "6" : "/u516d"        
    };         
    if(/(y+)/.test(fmt)){         
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));         
    }         
    if(/(E+)/.test(fmt)){         
        fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[this.getDay()+""]);         
    }         
    for(var k in o){         
        if(new RegExp("("+ k +")").test(fmt)){         
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));         
        }         
    }         
    return fmt;         
}       
var oDate = new Date();

exports.oDate = oDate;

exports.readFileAsync = function(fpath, encoding){
	return new Promise(function(resolve , reject){
		fs.readFile(fpath,encoding,function(err,content){
			if(err) 
				reject(err);
			else 
				resolve(content);
		})
	})
}

exports.writeFileAsync = function(fpath, content){
	return new Promise(function(resolve , reject){
		fs.writeFile(fpath,content,function(err){
			if(err) 
				reject(err);
			else 
				resolve();
		})
	})
}
exports.addFileAsync = function(fpath, content, encoding){
	return new Promise(function(resolve , reject){
		var fileEncoding =  encoding || "utf8";
		fs.readFile(fpath,fileEncoding,function(err,data){
			if(err) {
				reject(err);
			}else {
				var writeData = data+"\r\n"+content;
				fs.writeFile(fpath,writeData,function(err){
					if(err) 
						reject(err);
					else
						resolve();
				})
			}				
		})
		
	})
}
/*
 *XML转化为JSON数据
 */
exports.parseXMLAsync = function(xml){
	return new Promise(function(resolve,reject){
		xml2js.parseString(xml,{trim:true},function(err,content){
			if(err) {
				reject(err);
			} else {
				resolve(content);
			}
		})
	})
}
function formatMessage(result){
	var message = {};
	if(typeof result === 'object'){
		var keys = Object.keys(result);//返回result的所有自身属性的属性名组成的数组
		for(var i=0;i<keys.length;i++){
			var key = keys[i];
			var item = result[key];
			
			//如果item不为数组就跳过本次循环
			if(!(item instanceof Array) || item.length === 0 ){
				continue;
			}
			if(item.length === 1){
				var val = item[0];
				if(typeof val === 'object'){
					message[key] = formatMessage(val);
				}else{
					message[key] = (val || '').trim();
				}
			}else{//item长度大于1的情况下
				message[key] = [];
				for(var j=0; j<item.length;j++){
					message[key].push(formatMessage(item[j]));
				}
			}//if
		}//for
	}//if
	return message;
}
exports.formatMessage = formatMessage;
/*
 *生成回复消息模版
 */
exports.tpl = function(content,message){
	var info = {};
	var type = 'text';
	var fromUserName = message.FromUserName;
	var toUserName = message.ToUserName;

	if(Array.isArray(content)){
		type = 'news';
	}
	content = content || {};
	type = content.type || type;
	info.content = content;
	info.createTime = new Date().getTime();
	info.msgType = type;
	info.toUserName = fromUserName;
	info.fromUserName = toUserName;

	return tpl.compiled(info);
}
