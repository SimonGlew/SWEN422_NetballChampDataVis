var express = require('express');
var app = express();
var config = require('./config')

let dataLoader = require('./handlers/ultimateDataHandler')
dataLoader.loadData()

app.use('/', express.static(__dirname+'/public'));

app.get('/', (req,res)=>{
	res.sendFile('index.html');
});

app.get('/api/get/results', (req,res)=>{
	var year = req.query.year;
	res.send(dataLoader.getResults(year));
})

app.get('/api/get/allTeams', (req,res)=>{
	res.send({ teams: dataLoader.getAllTeams() });
})

app.listen(config.port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }
  console.log(`server is listening on ${config.port}`)
})


// app.ge


// app.set('views', './views');
// app.use(express.static('public'));
// app.use('/', router);
