var express = require('express');
var router = express.Router();

var DocumentWord = require('../model/schema/DocumentWord');
var _ = require('lodash');
var stopwords = require('vietnamese-stopwords');
var fs = require('fs');
var Tokenizer = require('node-vntokenizer');
var token = new Tokenizer();
var async = require('async');
var chalk = require('chalk');




/* GET home page. */
router.all('/', function(req, res, next) {
	if (req.method == "GET") {
		return res.render('index', {
			title: 'Express'
		});

	}	
	var data = req.body.content;
	var dataToken = _.difference(token.tokenize(data), stopwords);
	dataToken = _.uniq(dataToken);

	DocumentWord.find().distinct('type', function(err, types) {
		if (err) {
			return err;
		}
		var listTypes = [];
		var listWordByType = [];

		async.each(types, function(type, callback) {
			var listNumberTypes = [];
			DocumentWord.count({
				type: type
			}, function(err, count) {
				if (err) {
					return err;
				}
				listTypes.push(count);
				callback();
			});
			async.each(dataToken, function(token, callbackToken) {
				if (!Number.isInteger(parseInt(token)) && !_.isDate(token)) {
					DocumentWord.count({
						name: token.toLowerCase(),
						type: type
					}, function(err, count) {
						listWordByType.push({
							type: type,
							count: count,
							token: token
						});
						callbackToken();
					});
				}

			}, function(err) {

			});
		}, function(err) {
			var totalWord = _.reduce(listTypes, function(prev, current) {
				return prev + current;
			});
			var maximumLikelyHood = [];
			_.forEach(listTypes, function(value, key) {
				listTypes[key] = value / totalWord;
				var scaleForType = listTypes[key];
				_.forEach(listWordByType, function(item, keyItem) {
					if (item.type == types[key]) {
						// calcaulate word in type and smooth
						item.scale = (item.count + 1 / value + 2);
						item.value = value;
						scaleForType *= item.scale;
					}
				});
				maximumLikelyHood.push(scaleForType);
			});
			// console.log(listWordByType);
			var indexMax = indexOfMax(maximumLikelyHood);
			// console.log('file belongs to :' + types[indexMax]);
			return res.send(types[indexMax]);
		})

	});


});



function indexOfMax(arr) {
	if (arr.length === 0) {
		return -1;
	}
	var max = arr[0];
	var maxIndex = 0;
	for (var i = 1; i < arr.length; i++) {
		if (arr[i] >= max) {
			maxIndex = i;
			max = arr[i];
		}
	}
	return maxIndex;
}

module.exports = router;