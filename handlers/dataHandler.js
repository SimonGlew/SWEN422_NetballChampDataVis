const parse = require('csv-parse'),
    fs = require('fs')

const FILES = ['./data_files/2008-Table1.csv', './data_files/2009-Table1.csv', './data_files/2010-Table1.csv',
                './data_files/2011-Table1.csv', './data_files/2012-Table1.csv', './data_files/2013-Table1.csv']

async function loadData(){
    let parser = parse({columns: ['Round', 'Date', 'Time', 'Home Team', 'Score', 'Away Team', 'Venue']}, function(err, output){
        console.log('err', err)
        console.log('output', output)
    })

    FILES.forEach(file => {
        console.log('reading file: ', file)
        fs.createReadStream(file).pipe(parser)
    })
}

module.exports = {
    loadData: loadData
}