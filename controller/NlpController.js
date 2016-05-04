var DocumentWord = require('../model/schema/DocumentWord');

exports.getType = function(req, res) {
	DocumentWord.find().distinct('type', function(err, words) {
		console.log(words);
		res.send("hello get type");
	});
}

exports.index = function(req, res) {
	res.send("hello index");
}