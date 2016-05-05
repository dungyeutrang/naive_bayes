var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var DocumentWord = require('./model/schema/DocumentWord');
var _ = require('lodash');
var stopwords = require('vietnamese-stopwords');

var Tokenizer = require('node-vntokenizer');
var token = new Tokenizer();

mongoose.connect('mongodb://localhost/bayes');
var db = mongoose.connection;
db.on('error', function() {
	console.log('Connect database error');
});
db.once('open', function() {
	fs.readdir('dulieu', function(err, files) {
		if (err) {
			return err;
		}
		var numberFiles = files.length;
		_.forEach(files, function(file, keyFile) {
			console.log('Begin processing file ' + file);
			fs.readFile('dulieu/' + file, function(err, data) {
				if (err) return;
				words = token.tokenize(data.toString());
				var indexOfFileType = file.indexOf(' ');
				var type = file.substring(0, indexOfFileType)
					// save fille
				var numberWord = words.length;
				_.forEach(words, function(word, keyWord) {
					var wordOriginal = word.replace('_',' ');
					if (_.indexOf(stopwords, wordOriginal.toLowerCase()) == -1 && !Number.isInteger(parseInt(word)) && !_.isDate(word)) {
						DocumentWord.create({
							name: word.toLowerCase(),
							document: file,
							type: type
						}, function(err, model) {
							console.log((keyWord + 1), numberWord);
							console.log('Reading word ' + word + ' at ' + file);
							if ((keyFile + 1) == numberFiles && (keyWord + 1 == numberWord)) {
								console.log('Reading file success full !.....');
								return;
							}
						});
					} else {
						console.log((keyWord + 1), numberWord);
						if ((keyFile + 1 == numberFiles) && (keyWord + 1 == numberWord)) {
							console.log('Reading file success full !....');
							return;
						}
					}
				});
			});
		});
	});
}); // end open connect db