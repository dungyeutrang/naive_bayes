var DocumentWord = require('./model/schema/DocumentWord');
var _ = require('lodash');
var stopwords = require('vietnamese-stopwords');
var fs = require('fs');
var Tokenizer = require('node-vntokenizer');
var token = new Tokenizer();
var mongoose = require('mongoose');
var async = require('async');
var chalk = require('chalk');



// connect database
// 
mongoose.connect('mongodb://localhost/bayes');
var db = mongoose.connection;
db.on('error', function() {
	console.log('Connect database error');
});

// on connect database succesfull
db.once('open', function() {

	fs.readdir('dulieu_test', function(err, files) {
		if (err) {
			return err;
		}
		var i = 0;
		var j = 0;
		var numberFile = files.length;
		var listDocumentClassifyByType = [];
		async.each(files, function(file, callbackFile) {
			fs.readFile('dulieu_test/' + file, function(err, content) {
				var data = content.toString('utf-8');
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
								console.log('error here');
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
									item.scale = ((item.count + 1) / (value + 2)) * 100 + 1;
									item.value = value;
									scaleForType *= item.scale;
								}
							});
							maximumLikelyHood.push(scaleForType);
						});

						// console.log(listWordByType);
						var indexMax = indexOfMax(maximumLikelyHood);
						var typeOfFileName = file.replace('Test', '');
						var indexOfSpaceFile = typeOfFileName.indexOf(' ');
						var typeOfFile = typeOfFileName.substring(0, indexOfSpaceFile);
						console.log('file' + file + ' belongs to :' + types[indexMax]);
						j++;
						if (typeOfFile.toLowerCase() == types[indexMax].toLowerCase()) {
							++i;
							if (!listDocumentClassifyByType[indexMax]) {
								listDocumentClassifyByType[indexMax] = 1;
							} else {
								listDocumentClassifyByType[indexMax] += 1;
							}
							console.log("Match " + i + '/' + j + ' document ...!');
						}
						if (j == numberFile) {
							console.log(chalk.green("Result classifycation .............."));
							console.log(chalk.blue("Match " + i + '/' + j + ' document ...!'));
							for (t = 0; t < listDocumentClassifyByType.length; t++) {
								var percent = (listDocumentClassifyByType[t] / 20) * 100;
								var message = types[t] + " reach scale :" + percent + " %";
								if (t == 0) {
									console.log(chalk.cyan(message));
								} else if (t == 1) {
									console.log(chalk.magenta(message));
								} else if (t == 2) {
									console.log(chalk.yellow(message));
								} else if (t == 3) {
									console.log(chalk.blue(message));
								}else{
									console.log(message);
								}
							}
						}
						callbackFile();
					})

				});
			});
		}, function(err) {

		});
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