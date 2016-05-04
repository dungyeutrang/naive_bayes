var mongoose = require('mongoose');

var DocumentWord = mongoose.Schema({
	name:String,
	document:String,
	type:String
});

DocumentWord.index({ name: 1, document: 1,type: 1},{unique:true}); // schema level

module.exports = mongoose.model('DocumentWord',DocumentWord);