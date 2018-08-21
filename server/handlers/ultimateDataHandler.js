const parse = require('papaparse'),
    fs = require('fs')

const FILES = [{ file: './server/data_files/2008-Table1.csv', year: 2008 }, { file: './server/data_files/2009-Table1.csv', year: 2009 }, { file: './server/data_files/2010-Table1.csv', year: 2010 },
{ file: './server/data_files/2011-Table1.csv', year: 2011 }, { file: './server/data_files/2012-Table1.csv', year: 2012 }, { file: './server/data_files/2013-Table1.csv', year: 2013 }];

const REGEX_PATTERN_BYE_TEAMS = /\sand\s/gm

let results = { 2008: [], 2009: [], 2010: [], 2011: [], 2012: [], 2013: [] },
    teams = new Set()

function loadData() {
    FILES.forEach(f => {
        _parseCSVFile(fs.readFileSync(f.file, "utf8"), _csvFileParsed, f.year);
    })
}

function _csvFileParsed(data, year) {
    data.forEach(game => {
        if (game.Round) {
            //BYES
            if (game.Date.startsWith('BYES: ')) {
                game.Date.split('BYES: ')[1].trim().split(REGEX_PATTERN_BYE_TEAMS).forEach(team => {
                    results[year].push({ round: game.Round, bye: true, team: team })
                })
            } else {
                let homeScore = '', awayScore = ''
                let splitOne = game.Score.split('-'), splitTwo = game.Score.split('–')

                if(splitOne.length == 2 || splitTwo.length == 2){
                    let split = splitOne.length == 2 ? splitOne.map(s => s.trim()) : splitTwo.map(s => s.trim())
                    homeScore = split[0], awayScore = split[1]
                    if (isNaN(parseInt(homeScore)) || isNaN(parseInt(awayScore))) {
                        if (isNaN(parseInt(homeScore))) {
                            homeScore = homeScore.split(' ')[1]
                        }
                        if (isNaN(parseInt(awayScore))) {
                            awayScore = awayScore.split(' ')[1]
                        }
                    }
                }else {
                    let split = game.Score.split('(')[0].trim().split('–').map(s => s.trim())
                    homeScore = split[0], awayScore = split[0]
                }

                teams.add(game['Home Team'])
                teams.add(game['Away Team'])

                results[year].push({
                    round: game.Round,
                    date: game.Date,
                    hTeam: game['Home Team'],
                    score: game.Score,
                    homeScore: parseInt(homeScore),
                    awayScore: parseInt(awayScore),
                    aTeam: game['Away Team'],
                    venue: game.Venue,
                    winningTeam: parseInt(homeScore) > parseInt(awayScore) ? game['Home Team'] : game['Away Team']
                })
            }
        }
    })
}

function _parseCSVFile(file, callback, fileYear) {
    parse.parse(file, {
        delimiter: ",",
        newline: "",
        quoteChar: '"',
        escapeChar: '"',
        header: true,
        trimHeaders: false,
        dynamicTyping: false,
        preview: 0,
        encoding: "",
        worker: false,
        comments: false,
        step: undefined,
        complete: function (results) {
            callback(results.data, fileYear)
        },
        error: undefined,
        download: false,
        skipEmptyLines: false,
        chunk: undefined,
        fastMode: undefined,
        beforeFirstChunk: undefined,
        withCredentials: undefined,
        transform: undefined
    });
}


function getResults(year) {
    if (year) return results[year]
    return results
}

function getAllTeams(){
    return [...teams]
}

module.exports = {
    loadData: loadData,
    getAllTeams: getAllTeams,
    getResults: getResults
}
