var express = require('express');
var app = express();
var config = require('./config')

let dataLoader = require('./handlers/ultimateDataHandler')
dataLoader.loadData()

app.use('/', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
	res.sendFile('index.html');
});

app.get('/api/get/results', (req, res) => {
	var year = req.query.year;
	res.send(dataLoader.getResults(year));
})

app.get('/api/get/allTeams', (req, res) => {
	res.send({ teams: dataLoader.getAllTeams() });
})

app.get('/api/get/teamResults', (req, res) => {
	res.send(!req.query.team ? 'ERR' : dataLoader.getTeamResults(req.query.team))
})

app.get('/api/get/rivalsInformation', (req, res) => {
	if (!req.query.team) {
		res.send("ERR");
	}
	else {
		res.send(dataLoader.getRivalsInformation(req.query.team));

	}
})

app.get('/api/get/previousGamesVS', (req, res) => {
	if (!req.query.team) {
		res.send("ERR");
	}
	else if (!req.query.vsTeam) {
		res.send("ERR");
	}
	else {
		res.send(dataLoader.getPreviousGamesVS(req.query.team, req.query.vsTeam))
	}

})

app.listen(config.port, (err) => {
	if (err) {
		return console.log('something bad happened', err)
	}
	console.log(`server is listening on ${config.port}`)
})

dataLoader.getTeamResults()
//console.log(dataLoader.getTeamResults())


// app.ge


// app.set('views', './views');
// app.use(express.static('public'));
// app.use('/', router);
