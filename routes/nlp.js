var express = require('express');
var router = express.Router();
var NlpController = require('../controller/NlpController');

/* GET home page. */
router.get('/', NlpController.index);
router.get('/gettype', NlpController.getType);
module.exports = router;