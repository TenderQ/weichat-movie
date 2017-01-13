'use strict'
var Index = require('../app/controllers/index');
var User = require('../app/controllers/user');
var Movie = require('../app/controllers/movie');
var Comment = require('../app/controllers/comment');
var Category = require('../app/controllers/category');
var Admin = require('../app/controllers/admin');
var game = require('../app/controllers/game');
var wechat = require('../app/controllers/wechat');
var koaBody = require('koa-body');

module.exports = function(router) {
	
	router.get('/', Index.index);
	//查询
	router.get('/results',Index.search);

	// movie
	router.get('/movie/:id',Movie.detail);
	router.get('/movie/:id', Movie.detail)
    router.get('/admin/movie/new', User.signinRequired, User.adminRequired, Movie.new)
    router.get('/admin/movie/update/:id', User.signinRequired, User.adminRequired, Movie.update)
    router.post('/admin/movie', User.signinRequired, User.adminRequired, koaBody({multipart: true}), Movie.savePoster, Movie.save)
    router.get('/admin/movie/list', User.signinRequired, User.adminRequired, Movie.list)
    router.delete('/admin/movie/list', User.signinRequired, User.adminRequired, Movie.del)
    
	router.post('/user/comment',User.signinRequired,Comment.save);

	// user
	router.post('/user/signup', User.signup);
    router.post('/user/signin', User.signin);
    router.get('/signin', User.showSignin);
    router.get('/signup', User.showSignup);
    router.get('/logout', User.logout);
    router.get('/admin/user/list', User.signinRequired, User.adminRequired, User.list);
	
	//分类
	router.get('/admin/category/new', User.signinRequired, User.adminRequired, Category.new)
  	router.post('/admin/category', User.signinRequired, User.adminRequired, Category.save)
  	router.get('/admin/category/list', User.signinRequired, User.adminRequired, Category.list)
	
	//微信端
	router.get('/wx/movie',game.voice);
	router.get('/wx/movie/:id',game.find);
	router.get('/wx',wechat.hear);
	router.post('/wx',wechat.hear);
	router.post('/wx/jump/:id',game.jump);
};
