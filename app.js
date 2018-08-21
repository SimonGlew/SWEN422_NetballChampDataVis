var express = require('express');
var app = express();
var server = require('http').createServer(app);
var config = require('./config')
var router = require('./router')

let dataLoader = require('./handlers/dataHandler')
dataLoader.loadData()

server.listen(config.port, function () {
	console.log('Listening on port ' + config.port);
});

app.set('views', './views');
app.use(express.static('public'));
app.use('/', router);


