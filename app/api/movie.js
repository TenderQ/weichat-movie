var Movie = require('../models/movie');
var Category = require('../models/category');
var Comment = require('../models/comment');
var Keyword = require('../models/keyword');
var koa_request = require('koa-request');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var _ = require('lodash')
var co = require('co');

exports.findAll = function *() {
	var categories = yield Category.find({}).populate({path:'movies'}).exec()
	return categories;
}

exports.movieRank = function *() {
	var movies = yield Movie.find({}).sort({pv: -1}).limit(10).exec();
	return movies;
}

exports.searchByCategory = function *(catId) {
	var categories = yield Category.find({_id:catId}).populate({path:'movies'}).exec();
	return categories;
}

exports.findHotMovies = function *(hot,count) {
	var movies = yield Movie.find({}).sort({'pv':hot}).limit(count).exec();
	return movies;
}
exports.findMoviesByCate = function *(catename) {
	var category = yield Category.findOne({name:catename}).populate({path:'movies',select:'title poster _id'}).exec();
	return category;
}

exports.searchByName = function *(text) {
	var movies = yield Movie.find({title: new RegExp(text+".*",'i')}).exec();
	return movies;
}

exports.searchById = function *(id) {
	var movie = yield Movie.findOne({_id:id}).exec();
	return movie;
}

exports.searchByDouban = function *(text){
	var options = {
		url: 'https://api.douban.com/v2/movie/search?q='
	}
	options.url += encodeURIComponent(text);
	
	var response = yield koa_request(options);
	var data = JSON.parse(response.body);
	var subjects = [];
	var movies = [];
	if(data && data.subjects){
		subjects = data.subjects;
	}
	if(subjects.length > 0){
		var queryArray = [];
		subjects.forEach(function(item){
			queryArray.push(function *(){
				var movie = yield Movie.findOne({did:item.id});
				
				if(movie){
					movies.push(movie);
				} else {
					var director = item.directors;
					var actors = item.casts;
					var array1 = [],array2=[];
					for(var i=0;i<director.length;i++){
						array1.push(director[i].name);
					}
					for(var i=0;i<actors.length;i++){
						array2.push(actors[i].name);
					}
					director =  array1.join('/');
					actors = array2.join('/');
					movie = new Movie({
						did: item.id,//豆瓣ID
						director: director,
						title: item.title,
						actors: actors,
						poster: item.images.large,
						year: item.year,
						genres: item.genres || ''
					})
					movie = yield movie.save();
					movies.push(movie);
				}
			});
		});
		yield queryArray;
		movies.forEach(function(movie){
			updateMovies(movie);
		})
	}
	return movies;
}

function updateMovies(movie){
	var options = {
		url: 'https://api.douban.com/v2/movie/subject/' + movie.did,
		json: true
	}
	request(options).then(function(response){
		var data = response.body; 
		_.extend(movie,{
			country: data.countries ? data.countries[0] : '',
			summary: data.summary,
			language: data.language
		})
		var genres = movie.genres;
		if(genres && genres.length>0){
			var cateArray = [];
//			genres.forEach(function(genre){
			var genre = genres[0];
			cateArray.push(function *(){
				var cat = yield Category.findOne({name:genre}).exec();
				if(cat){
					cat.movies.push(movie._id);
					yield cat.save();
				} else {
					cat = new Category({
						name:genre,
						movies:[movie._id]
					})
					cat = yield cat.save();
					movie.category = cat._id;
					yield movie.save();
				}
			})
//			})
			co(function *() {
		    	yield cateArray;
		    })
		} else {
			movie.save();
		}
	})
}
