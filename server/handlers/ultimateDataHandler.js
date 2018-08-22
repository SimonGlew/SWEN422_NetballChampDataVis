const parse = require('papaparse'),
    fs = require('fs')

const FILES = [{ file: './server/data_files/2008-Table1.csv', year: 2008 }, { file: './server/data_files/2009-Table1.csv', year: 2009 }, { file: './server/data_files/2010-Table1.csv', year: 2010 },
{ file: './server/data_files/2011-Table1.csv', year: 2011 }, { file: './server/data_files/2012-Table1.csv', year: 2012 }, { file: './server/data_files/2013-Table1.csv', year: 2013 }];

const REGEX_PATTERN_BYE_TEAMS = /\sand\s/gm

let results = { 2008: [], 2009: [], 2010: [], 2011: [], 2012: [], 2013: [] },
    resultsTable = null
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

                if (splitOne.length == 2 || splitTwo.length == 2) {
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
                } else {
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

function getAllTeams() {
    return [...teams]
}

//Please simon give me this bad boi, pass you a team, you give back this shit for all other teams <3
function getRivalsInformation(team) {
    return JSON.parse(' [ { "name":"Chiefs", "winrateVS":"30%", "totalPointsDiff":"-13", "isRival":true }, { "name":"Central Pulse", "winrateVS":"56%", "totalPointsDiff":"57", "isRival":true }, { "name":"Voluptous Vultures", "winrateVS":"5%", "totalPointsDiff":"-270", "isRival":true } ] ');
}

//Please simon give me shit like below, sorted by date order is CRUCIAL, catch you tmoz night <3

function getPreviousGamesVS(team, vsTeam) {
    return JSON.parse(' [ {"round":"1","date":"Saturday 5 April","team":"Melbourne Vixens", "vsTeam":"Central Pulse", "wasHome":false, "pointsDiff":25,"venue":"TSB Bank Arena, Wellington","winningTeam":"Melbourne Vixens"}, {"round":"1","date":"Saturday 5 April","team":"Melbourne Vixens", "vsTeam":"Central Pulse", "wasHome":false, "pointsDiff":-35,"venue":"TSB Bank Arena, Wellington","winningTeam":"Melbourne Vixens"} ] ');
}

function getVenues(team) {
    let venues = { home: {}, away: {} }

    Object.keys(results).forEach(year => {
        results[year].filter(r => r.hTeam == team).forEach(homeGame => {

        })
        results[year].filter(r => r.aTeam == team).forEach(awayGame => {

        })
    })
}

function getTeamResults(team) {
    if (!resultsTable) {
        _makeResultTable()
    }

    team = 'Adelaide Thunderbirds'

    let teamPlacing = []

    Object.keys(resultsTable).forEach(year => {
        let yearObj = { placement: 0, rounds: [], year: parseInt(year) }
        Object.keys(resultsTable[year]).forEach((roundNumber, index) => {
            let roundPlacement = resultsTable[year][roundNumber].map(r => r.team).indexOf(team)

            yearObj.rounds.push({ round: parseInt(roundNumber), placement: roundPlacement + 1 })

            if (index == Object.keys(resultsTable[year]).length - 1) yearObj.placement = roundPlacement + 1
        })

        yearObj.rounds.sort((a, b) => a.round - b.round)
        teamPlacing.push(yearObj)
    })
    teamPlacing.sort((a, b) => a.year - b.year)

    //console.log(JSON.stringify(teamPlacing, null, 2))


}

function _makeResultTable() {
    resultsTable = { 2008: {}, 2009: {}, 2010: {}, 2011: {}, 2012: {}, 2013: {} }

    Object.keys(results).forEach(year => {
        results[year].forEach((game, index) => {
            if (index + 4 < results[year].length) {
                let round = parseInt(game.round)
                if (!resultsTable[year][String(round)] || !resultsTable[year][String(round)].length)
                    resultsTable[year][String(round)] = []
                if (round > 1) {
                    if (!game.bye) {
                        if((game.hTeam == 'Adelaide Thunderbirds' || game.aTeam == 'Adelaide Thunderbirds') && year == '2011'){
                            console.log(game)
                        }
                        let indexHome = (resultsTable[year][String(round - 1)]).map(r => r.team).indexOf(game.hTeam)
                        let indexAway = (resultsTable[year][String(round - 1)]).map(r => r.team).indexOf(game.aTeam)

                        let prevHomeTeam = resultsTable[year][String(round - 1)][indexHome]
                        let prevAwayTeam = resultsTable[year][String(round - 1)][indexAway]

                        let homeTeamPoints = (prevHomeTeam ? prevHomeTeam.points : 0) + (game.homeScore > game.awayScore ? 2 : 0)
                        let awayTeamPoints = (prevAwayTeam ? prevAwayTeam.points : 0) + (game.homeScore > game.awayScore ? 0 : 2)

                        let homePD = (prevHomeTeam ? prevHomeTeam.PD : 0) + (game.homeScore - game.awayScore)
                        let awayPD = (prevAwayTeam ? prevAwayTeam.PD : 0) + (game.awayScore - game.homeScore)

                        resultsTable[year][game.round].push({ team: game.hTeam, points: homeTeamPoints, PD: homePD })
                        resultsTable[year][game.round].push({ team: game.aTeam, points: awayTeamPoints, PD: awayPD })
                    } else {
                        let index = resultsTable[year][String(round - 1)].map(r => r.team).indexOf(game.team)
                        resultsTable[year][round].push(resultsTable[year][String(round - 1)][index])
                    }
                } else {
                    //first round
                    let homeTeamPoints = (game.homeScore > game.awayScore ? 2 : 0)
                    let awayTeamPoints = (game.homeScore > game.awayScore ? 0 : 2)

                    let homePD = (game.homeScore - game.awayScore)
                    let awayPD = (game.awayScore - game.homeScore)

                    resultsTable[year][round].push({ team: game.hTeam, points: homeTeamPoints, PD: homePD })
                    resultsTable[year][round].push({ team: game.aTeam, points: awayTeamPoints, PD: awayPD })
                }
            }
        })
        let finalRound = [], finalRoundRound = null
        Object.keys(resultsTable[year]).forEach(round => {
            resultsTable[year][round].sort((a, b) => {
                if (a.points != b.points) return b.points - a.points
                else return b.PD - a.PD
            })
            finalRound = resultsTable[year][round]
            finalRoundRound = parseInt(round)
        })

        let index = results[year].length
        if (!resultsTable[year][finalRoundRound + 1] || !resultsTable[year][finalRoundRound + 1].length)
            resultsTable[year][finalRoundRound + 1] = []
        if (!resultsTable[year][finalRoundRound + 2] || !resultsTable[year][finalRoundRound + 2].length)
            resultsTable[year][finalRoundRound + 2] = []
        if (!resultsTable[year][finalRoundRound + 3] || !resultsTable[year][finalRoundRound + 3].length)
            resultsTable[year][finalRoundRound + 3] = []

        //FIRST SEMI
        let winnerOne = results[year][index - 4].winningTeam
        let loserOne = (results[year][index - 4].winningTeam == results[year][index - 4].hTeam ? results[year][index - 4].aTeam : results[year][index - 4].hTeam)
        //SECOND SEMI
        let winnerTwo = results[year][index - 3].winningTeam
        let loserTwo = (results[year][index - 3].winningTeam == results[year][index - 3].hTeam ? results[year][index - 3].aTeam : results[year][index - 3].hTeam)

        //WINNERS
        r = finalRoundRound + 1
        if (results[year][index - 2].aTeam == winnerOne) {
            resultsTable[year][r][2] = { team: winnerOne }
        } else {
            resultsTable[year][r][0] = { team: winnerOne }
        }

        if (results[year][index - 2].aTeam == winnerTwo) {
            resultsTable[year][r][2] = { team: winnerTwo }
        } else {
            resultsTable[year][r][0] = { team: winnerTwo }
        }

        //LOSERS
        if (results[year][index - 2].hTeam == loserOne) {
            resultsTable[year][r][1] = { team: loserOne }
        } else {
            resultsTable[year][r][3] = { team: loserOne }
        }

        if (results[year][index - 2].hTeam == loserTwo) {
            resultsTable[year][r][1] = { team: loserTwo }
        } else {
            resultsTable[year][r][3] = { team: loserTwo }
        }


        finalRound.forEach((team, index) => {
            if (index > 3) {
                //if(year == '2011')            console.log(team)

                resultsTable[year][finalRoundRound + 1][index] = team
            }
        })

        resultsTable[year][finalRoundRound + 2][1] = { team: results[year][index - 2].winningTeam }
        resultsTable[year][finalRoundRound + 2][2] = { team: (results[year][index - 2].winningTeam == results[year][index - 2].hTeam ? results[year][index - 2].aTeam : results[year][index - 2].hTeam) }


        resultsTable[year][finalRoundRound + 1].forEach((team, index) => {
            if (index > 2 || index == 0) {
                resultsTable[year][finalRoundRound + 2][index] = team
            }
        })

        resultsTable[year][finalRoundRound + 3][0] = { team: results[year][index - 1].winningTeam }
        resultsTable[year][finalRoundRound + 3][1] = { team: (results[year][index - 1].winningTeam == results[year][index - 1].hTeam ? results[year][index - 1].aTeam : results[year][index - 1].hTeam) }

        //ACTUAL FINAL
        resultsTable[year][finalRoundRound + 2].forEach((team, index) => {
            if (index > 1) {
                resultsTable[year][finalRoundRound + 3][index] = team
            }
        })
    })

}




module.exports = {
    loadData: loadData,
    getAllTeams: getAllTeams,
    getResults: getResults,
    getRivalsInformation: getRivalsInformation,
    getPreviousGamesVS: getPreviousGamesVS,
    getTeamResults: getTeamResults
}
