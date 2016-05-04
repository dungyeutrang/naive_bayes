var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var DocumentWord = require('./model/schema/DocumentWord');
var _ = require('lodash');
var stopwords = require('vietnamese-stopwords');
var listStopWordPlus = ['.', ',', '"', ':', "|", '_', '-', '+', '-', '*', ':', '{', '}', '<', '>', '<=', '>=', '=', '@', '!', '?', '#', "*", '^', '%'];
stopwords.concat(listStopWordPlus);

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
		_.forEach(files, function(file, key) {
			console.log('Begin processing file ' + file);
			fs.readFile('dulieu/' + file, function(err, data) {
				if (err) return;
				words = token.tokenize(data.toString());
				var indexOfFileType = file.indexOf('(');
				var type = file.substring(0, indexOfFileType).trim();
				// save fille
				var listdDocumentWord = [];
				_.forEach(words, function(word, key) {
					if (_.indexOf(stopwords, word) > -1) {
						DocumentWord.create({
							name: word,
							document: file,
							type: type
						}, function(err, model) {
							console.log('Reading word '+word +' at '+ file);
						});
					}
				});
			});
		});
	});
}); // end open connect db