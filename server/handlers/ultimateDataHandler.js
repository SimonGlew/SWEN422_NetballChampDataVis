const parse = require('papaparse'),
	fs = require('fs'),
	moment = require('moment')

const FILES = [{ file: './server/data_files/2008-Table1.csv', year: 2008 }, { file: './server/data_files/2009-Table1.csv', year: 2009 }, { file: './server/data_files/2010-Table1.csv', year: 2010 },
{ file: './server/data_files/2011-Table1.csv', year: 2011 }, { file: './server/data_files/2012-Table1.csv', year: 2012 }, { file: './server/data_files/2013-Table1.csv', year: 2013 }];

const REGEX_PATTERN_BYE_TEAMS = /\sand\s/gm

let results = { 2008: [], 2009: [], 2010: [], 2011: [], 2012: [], 2013: [] },
	resultsTable = null
teams = new Set()

/**
 * Entry point for loading in the data, calls a parseCSV private method for each of the files
 */
function loadData() {
	FILES.forEach(f => {
		_parseCSVFile(fs.readFileSync(f.file, "utf8"), _csvFileParsed, f.year);
	})
}

/**
 * Callback for CSV parsing, pushes data in results map
 * 
 * @param {Map} data - objects parsed from CSV
 * @param {Number} year - year of CSV
 */
function _csvFileParsed(data, year) {
	data.forEach(game => {
		if (game.Round) {
			//BYES row has different format, need to add two rows in for each team on a bye
			if (game.Date.startsWith('BYES: ')) {
				game.Date.split('BYES: ')[1].trim().split(REGEX_PATTERN_BYE_TEAMS).forEach(team => {
					results[year].push({ round: game.Round, bye: true, team: team })
				})
			} else {
				let homeScore = '', awayScore = ''
				//need to split with two different characters due to formatting of csv
				let splitOne = game.Score.split('-'), splitTwo = game.Score.split('–')

				//If the two different scores were found correctly
				if (splitOne.length == 2 || splitTwo.length == 2) {
					//format two scores [homeScore, awayScore]
					let split = splitOne.length == 2 ? splitOne.map(s => s.trim()) : splitTwo.map(s => s.trim())
					homeScore = split[0], awayScore = split[1]
					//If scores are in funny format, split on a space and use that as the score for the team
					if (isNaN(parseInt(homeScore)) || isNaN(parseInt(awayScore))) {
						if (isNaN(parseInt(homeScore))) {
							homeScore = homeScore.split(' ')[1]
						}
						if (isNaN(parseInt(awayScore))) {
							awayScore = awayScore.split(' ')[1]
						}
					}
				} else {
					//Catch row with (draw) in the score
					let split = game.Score.split('(')[0].trim().split('–').map(s => s.trim())
					homeScore = split[0], awayScore = split[0]
				}

				//Add the two teams to the team set
				teams.add(game['Home Team'])
				teams.add(game['Away Team'])


				//Format the date of the game into a usable format
				let dateArray = game.Date.split(' ')
				if (dateArray[1].length == 1) dateArray[1] = '0' + dateArray[1]
				let date = year + '-' + moment().month(dateArray[2]).format('MM') + '-' + dateArray[1]

				//Push the game into the array for that year
				results[year].push({
					round: game.Round,
					date: date,
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

/**
 * Parse the CSV file passed in
 * 
 * @param {File} file - File object for parsing
 * @param {Function} callback - function to give data back to
 * @param {Number} fileYear - year of CSV file 
 */
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

/**
 * Get all results for that year
 * 
 * @param {Number} year - year to get results from
 * 
 * @returns {Round[]} results - All results for that round
 */
function getResults(year) {
	if (year) return results[year]
	return results
}

/**
 * Returns an array of all teams
 * 
 * @returns {String[]} teams - array of all teams within the competition
 */
function getAllTeams() {
	return [...teams]
}

/**
 * Get winRate and totalPointDiff for each other team in the competition
 * 
 * @param {String} team - team to filter out
 * @param {String} startYear - year to start looking at 
 * @param {String} endYear - year to finish looking at
 * @param {String} finals - rounds to filter by (all, regular, finals)
 * 
 * @param {[name: String, winrateVS: String, totalPointsDiff: Number, isRival: boolean]} rivalInfo - information about all other teams in competition
 */
function getRivalsInformation(team, startYear, endYear, finals) {
	let otherTeams = {}

	//Go through each year within the results map
	Object.keys(results).forEach(year => {
		//Filter out incorrect years
		if (year >= startYear && year <= endYear) {
			//Get last round of that year
			let maxRound = results[year].map(r => parseInt(r.round))[results[year].length - 1]
			//Filter out games that dont include the team that is wanted
			results[year].filter(r => r.hTeam == team || r.aTeam == team).forEach(game => {
				//Filter out games that dont match the finals flag
				if (finals == 'all' || (finals == 'regular' && (parseInt(game.round) <= maxRound - 3)) || (finals == 'finals' && (parseInt(game.round) > maxRound - 3))) {
					//Work out timesPlayed, timesWon and pointsDiff for all the other teams using a map
					let otherTeam = game.hTeam == team ? game.aTeam : game.hTeam
					if (!otherTeams[otherTeam]) {
						otherTeams[otherTeam] = { timesPlayed: 0, timesWon: 0, pointsDiff: 0 }
					}
					otherTeams[otherTeam].timesPlayed += 1
					otherTeams[otherTeam].timesWon += (game.winningTeam == team ? 1 : 0)
					otherTeams[otherTeam].pointsDiff += (game.hTeam == team ? game.homeScore - game.awayScore : game.awayScore - game.homeScore)
				}
			})
		}
	})

	//Format the otherTeams map into an array and work out winrate and if team is rival
	let returnObj = []
	Object.keys(otherTeams).forEach(key => {
		let otherTeamObj = otherTeams[key]
		let teamObj = {
			name: key,
			winrateVS: (((otherTeamObj.timesWon / otherTeamObj.timesPlayed) * 100).toFixed(0)) + '%',
			totalPointsDiff: otherTeamObj.pointsDiff
		}
		teamObj.isRival = teamObj.winrateVS >= 25 && teamObj.winrateVS <= 75

		returnObj.push(teamObj)
	})

	//sort by name
	returnObj.sort((a, b) => a.name - b.name)

	return returnObj
}

/**
 * Get all games played between two teams that fit between the filters
 * 
 * @param {String} team - 1st team selected 
 * @param {String} vsTeam - 2nd team selected
 * @param {String} startYear - year to start looking at 
 * @param {String} endYear - year to finish looking at
 * @param {String} finals - rounds to filter by (all, regular, finals)
 * 
 * @returns {Game[]} games - array of games played between the two teams sorted by oldest to newest
 */
function getPreviousGamesVS(team, vsTeam, startYear, endYear, finals) {
	let prevGames = []

	//Go through each year within the results map
	Object.keys(results).forEach(year => {
		//Filter out incorrect years
		if (year >= startYear && year <= endYear) {
			//Find last round of that year
			let maxRound = results[year].map(r => parseInt(r.round))[results[year].length - 1]

			//Filter out games that dont have the two teams playing in it
			results[year].filter(r => r.hTeam == team && r.aTeam == vsTeam || r.aTeam == team && r.hTeam == vsTeam).forEach(game => {
				//Filter out games that dont match the finals flag
				if (finals == 'all' || (finals == 'regular' && (parseInt(game.round) <= maxRound - 3)) || (finals == 'finals' && (parseInt(game.round) > maxRound - 3))) {
					prevGames.push({
						round: game.round,
						date: game.date,
						team: team,
						vsTeam: vsTeam,
						wasHome: game.hTeam == team,
						pointsDiff: (game.hTeam == team ? game.homeScore : game.awayScore) - (game.hTeam == vsTeam ? game.homeScore : game.awayScore),
						venue: game.venue,
						winningTeam: game.winningTeam
					})
				}
			})
		}
	})

	return prevGames
}

/**
 * Get all venues the team played at, both home and away
 * 
 * @param {String} team - team to look for
 * @param {String} startYear - year to start looking at 
 * @param {String} endYear - year to finish looking at
 * @param {String} finals - rounds to filter by (all, regular, finals)
 * 
 * @param {home: Venue[], away: Venue[]} venues - venues team played at sorted into home and away lists
 */
function getVenues(team, startYear, endYear, finals) {
	let venues = { home: {}, away: {} }

	//Go through each year within the results map
	Object.keys(results).forEach(year => {
		//Filter out incorrect years
		if (year >= startYear && year <= endYear) {
			//Find last round of that year
			let maxRound = results[year].map(r => parseInt(r.round))[results[year].length - 1]

			//Filter out all away games for that team and games that the team didnt play in
			results[year].filter(r => r.hTeam == team).forEach(homeGame => {
				//Filter out games that dont match the finals flag
				if (finals == 'all' || (finals == 'regular' && (parseInt(homeGame.round) <= maxRound - 3)) || (finals == 'finals' && (parseInt(homeGame.round) > maxRound - 3))) {
					//initalise venue in map if not seen before
					if (!venues.home[homeGame.venue]) {
						venues.home[homeGame.venue] = { timesPlayed: 0, timesWin: 0 }
					}
					//if winning team, add one to timesWin
					if (team == homeGame.winningTeam) {
						venues.home[homeGame.venue].timesWin += 1
					}
					venues.home[homeGame.venue].timesPlayed += 1
				}
			})

			//Filter out all home games for that team and games that the team didnt play in
			results[year].filter(r => r.aTeam == team).forEach(awayGame => {
				//Filter out games that dont match the finals flag
				if (finals == 'all' || (finals == 'regular' && (parseInt(awayGame.round) <= maxRound - 3)) || (finals == 'finals' && (parseInt(awayGame.round) > maxRound - 3))) {
					//initalise venue in map if not seen before
					if (!venues.home[awayGame.venue]) {
						venues.away[awayGame.venue] = { timesPlayed: 0, timesWin: 0 }
					}
					//if winning team, add one to timesWin
					if (team == awayGame.winningTeam) {
						venues.away[awayGame.venue].timesWin += 1
					}
					venues.away[awayGame.venue].timesPlayed += 1
				}
			})
		}
	})

	let obj = { home: [], away: [] }

	//Format home venues from a map to an array and sort it by games played at venue
	Object.keys(venues.home).forEach(key => {
		let v = venues.home[key]
		obj.home.push({ venue: key, played: v.timesPlayed, won: v.timesWin, win_rate: (v.timesWin / v.timesPlayed) * 100 })
	})
	obj.home.sort((a, b) => b.played - a.played)

	//Format away venues from a map to an array and sort it by games played at venue
	Object.keys(venues.away).forEach(key => {
		let v = venues.away[key]
		obj.away.push({ venue: key, played: v.timesPlayed, won: v.timesWin, win_rate: (v.timesWin / v.timesPlayed) * 100 })
	})
	obj.away.sort((a, b) => b.played - a.played)

	return obj
}

/**
 * Gets placings for each round for each year for a specific team, builds all results tables for each round,year if not cached
 * 
 * @param {String} team - team to find results for 
 * 
 * @returns {Year[]} results - array of year objects that hold an array of rounds, finalPlacement and year
 */
function getTeamResults(team) {
	//Build results table if not found
	if (!resultsTable) {
		_makeResultTable()
	}

	let teamPlacing = []

	//Go through each year
	Object.keys(resultsTable).forEach(year => {
		let yearObj = { placement: 0, rounds: [], year: parseInt(year) }
		//Go through each round in the year and find the current placing for this round 
		Object.keys(resultsTable[year]).forEach((roundNumber, index) => {
			let roundPlacement = resultsTable[year][roundNumber].map(r => r.team).indexOf(team)

			yearObj.rounds.push({ round: parseInt(roundNumber), placement: roundPlacement + 1 })

			//Find final placing for the team for that year
			if (index == Object.keys(resultsTable[year]).length - 1) yearObj.placement = roundPlacement + 1
		})

		//sort by round number for year 1->last
		yearObj.rounds.sort((a, b) => a.round - b.round)
		teamPlacing.push(yearObj)
	})
	//sort by year oldest -> newest
	teamPlacing.sort((a, b) => a.year - b.year)

	return teamPlacing
}

/**
 * Private method that is used for simulating and making all results for each round within the competition
 */
function _makeResultTable() {
	resultsTable = { 2008: [], 2009: [], 2010: [], 2011: [], 2012: [], 2013: [] }

	//For each year that was read in
	Object.keys(results).forEach(year => {
		//initalise year in results 
		if (!resultsTable[year])
			resultsTable[year] = []
		//for each game within that year
		results[year].forEach((game, index) => {
			//filter out finals games (last 4 games within the year)
			if (index + 4 < results[year].length) {
				//Get round of game
				let round = parseInt(game.round)
				//initalise round in year of results
				if (!resultsTable[year][String(round)])
					resultsTable[year][String(round)] = []
				//filter out games that arent round 1
				if (round > 1) {
					//filter out games that arent byes
					if (!game.bye) {
						//see if home/away team have already played during round
						let indexHome = resultsTable[year][round].map(r => r.team).indexOf(game.hTeam)
						let indexAway = resultsTable[year][round].map(r => r.team).indexOf(game.aTeam)

						let homePlayed = true, awayPlayed = true
						//If home team hasnt played in the current round
						if (indexHome == -1) {
							//if round is greater than 2, used to see how many weeks you can check back
							if (round > 2) {
								//if team hasnt played in the last round, get their current standing within the last 2 weeks and push it into the next week (1 week behind)
								if (resultsTable[year][round - 1].map(r => r.team).indexOf(game.hTeam) == -1) {
									let i = resultsTable[year][round - 2].map(r => r.team).indexOf(game.hTeam)
									resultsTable[year][round - 1].push(resultsTable[year][round - 2][i])
								}
							} else {
								//If not played last week, push new team object into the array
								if (resultsTable[year][round - 1].map(r => r.team).indexOf(game.hTeam) == -1) {
									resultsTable[year][round - 1].push({ team: game.hTeam, points: 0, PD: 0 })
								}
							}
							//set homePlayed flag to false and update the indexHome index
							homePlayed = false
							indexHome = resultsTable[year][round - 1].map(r => r.team).indexOf(game.hTeam)
						}
						//If away team hasnt played in the current round
						if (indexAway == -1) {
							//if round is greater than 2, used to see how many weeks you can check back
							if (round > 2) {
								//if team hasnt played in the last round, get their current standing within the last 2 weeks and push it into the next week (1 week behind)
								if (resultsTable[year][round - 1].map(r => r.team).indexOf(game.aTeam) == -1) {
									let i = resultsTable[year][round - 2].map(r => r.team).indexOf(game.aTeam)
									resultsTable[year][round - 1].push(resultsTable[year][round - 2][i])
								}
							} else {
								//If not played last week, push new team object into the array
								if (resultsTable[year][round - 1].map(r => r.team).indexOf(game.aTeam) == -1) {
									resultsTable[year][round - 1].push({ team: game.aTeam, points: 0, PD: 0 })
								}
							}
							//set awayPlayed flag to false and update the indexAway index
							awayPlayed = false
							indexAway = resultsTable[year][round - 1].map(r => r.team).indexOf(game.aTeam)
						}
						//Get the last known team obj for a certain team and put into variable
						let prevHomeTeam = homePlayed ? resultsTable[year][round][indexHome] : resultsTable[year][round - 1][indexHome]
						let prevAwayTeam = awayPlayed ? resultsTable[year][round][indexAway] : resultsTable[year][round - 1][indexAway]

						//Update championship points for home and away teams
						let homeTeamPoints = prevHomeTeam.points + (game.winningTeam == game.hTeam ? 2 : 0)
						let awayTeamPoints = prevAwayTeam.points + (game.winningTeam == game.aTeam ? 2 : 0)

						//Update point difference for home and away teams
						let homePD = prevHomeTeam.PD + (game.homeScore - game.awayScore)
						let awayPD = prevAwayTeam.PD + (game.awayScore - game.homeScore)



						//Either update teamObj if they have already played in round or push new teamObj onto the round array
						if (homePlayed) {
							resultsTable[year][game.round][indexHome] = { team: game.hTeam, points: homeTeamPoints, PD: homePD }
						} else {
							resultsTable[year][game.round].push({ team: game.hTeam, points: homeTeamPoints, PD: homePD })
						}

						if (awayPlayed) {
							resultsTable[year][game.round][indexAway] = { team: game.aTeam, points: awayTeamPoints, PD: awayPD }
						} else {
							resultsTable[year][game.round].push({ team: game.aTeam, points: awayTeamPoints, PD: awayPD })
						}
					} else {
						//BYE - carry over last known standing (last round) to the current round
						let i = resultsTable[year][round - 1].map(r => r.team).indexOf(game.team)
						resultsTable[year][game.round].push(resultsTable[year][round - 1][i])
					}
				} else {
					//FIRST ROUND

					//Set championship points for home and away teams depending on who won
					let homeTeamPoints = (game.winningTeam == game.hTeam ? 2 : 0)
					let awayTeamPoints = (game.winningTeam == game.aTeam ? 2 : 0)

					//Set points difference between the two teams
					let homePD = (game.homeScore - game.awayScore)
					let awayPD = (game.awayScore - game.homeScore)

					//push the two team objects onto the round array
					resultsTable[year][game.round].push({ team: game.hTeam, points: homeTeamPoints, PD: homePD })
					resultsTable[year][game.round].push({ team: game.aTeam, points: awayTeamPoints, PD: awayPD })
				}
			}
		})

		//Get final round and roundNumber of regular season for that year and sort rounds by points and then points difference 
		let finalRound = [], finalRoundRound = null
		Object.keys(resultsTable[year]).forEach(round => {
			resultsTable[year][round].sort((a, b) => {
				if (a.points != b.points) return b.points - a.points
				else return b.PD - a.PD
			})
			finalRound = resultsTable[year][round]
			finalRoundRound = parseInt(round)
		})


		/**
		 * LAST 3 WEEKS - FINALS
		 * 
		 * This code is hardcoding finals, we always expect last 4 games to look like the following:
		 * 
		 * Game 1/2 - Major/Minor Semifinal
		 * Game 3 - Winner of Minor/Loser of Major
		 * Game 4 - Final
		 */

		//initialise the last 3 rounds of the competition
		let index = results[year].length
		if (!resultsTable[year][finalRoundRound + 1] || !resultsTable[year][finalRoundRound + 1].length)
			resultsTable[year][finalRoundRound + 1] = []
		if (!resultsTable[year][finalRoundRound + 2] || !resultsTable[year][finalRoundRound + 2].length)
			resultsTable[year][finalRoundRound + 2] = []
		if (!resultsTable[year][finalRoundRound + 3] || !resultsTable[year][finalRoundRound + 3].length)
			resultsTable[year][finalRoundRound + 3] = []

		//Find teamName of winner and loser of the first semi final
		let winnerOne = results[year][index - 4].winningTeam
		let loserOne = (results[year][index - 4].winningTeam == results[year][index - 4].hTeam ? results[year][index - 4].aTeam : results[year][index - 4].hTeam)
		//Find teamName of winner and loser of the second semi final
		let winnerTwo = results[year][index - 3].winningTeam
		let loserTwo = (results[year][index - 3].winningTeam == results[year][index - 3].hTeam ? results[year][index - 3].aTeam : results[year][index - 3].hTeam)

		//update round index
		r = finalRoundRound + 1
		
		//This looks at winners, looking at the away team of the 2nd/3rd final, away team of this game (index - 2) must be the team that won the minor semi final
		if (results[year][index - 2].aTeam == winnerOne) {
			resultsTable[year][r][2] = { team: winnerOne } //Currently 3rd place, won minor semi final
		} else {
			resultsTable[year][r][0] = { team: winnerOne } //Currently 1st place, won major semi final
		}

		if (results[year][index - 2].aTeam == winnerTwo) {
			resultsTable[year][r][2] = { team: winnerTwo } //Currently 3rd place, won minor semi final
		} else {
			resultsTable[year][r][0] = { team: winnerTwo } //Currently 1st place, won major semi final
		}

		//This looks at losers, looking at the home team of the 2nd/3rd final, home team of this game (index - 2) must be the team that lost the major semi final
		if (results[year][index - 2].hTeam == loserOne) {
			resultsTable[year][r][1] = { team: loserOne } //Currently 2nd place, won major semi final
		} else {
			resultsTable[year][r][3] = { team: loserOne } //Currently 4th place, lost minor semi final
		}

		if (results[year][index - 2].hTeam == loserTwo) {
			resultsTable[year][r][1] = { team: loserTwo } //Currently 2nd place, won major semi final
		} else {
			resultsTable[year][r][3] = { team: loserTwo } //Currently 4th place, lost minor semi final
		}

		//Updates all other teams 5th - 10th for this round, they did not take part in this round, so they keep the same position
		finalRound.forEach((team, index) => {
			if (index > 3) {
				resultsTable[year][finalRoundRound + 1][index] = team
			}
		})

		//2nd/3rd playoff - Winner of this game, will be the winningTeam, therefore must be in the 2nd position for this round, other team will be 3rd
		resultsTable[year][finalRoundRound + 2][1] = { team: results[year][index - 2].winningTeam }
		resultsTable[year][finalRoundRound + 2][2] = { team: (results[year][index - 2].winningTeam == results[year][index - 2].hTeam ? results[year][index - 2].aTeam : results[year][index - 2].hTeam) }


		//Update 1st/4th-10th as they did not take part in this round, so they keep the same position
		resultsTable[year][finalRoundRound + 1].forEach((team, index) => {
			if (index > 2 || index == 0) {
				resultsTable[year][finalRoundRound + 2][index] = team
			}
		})

		//Final - Winning team finishes 1st, other team therefore must be finishing second
		resultsTable[year][finalRoundRound + 3][0] = { team: results[year][index - 1].winningTeam }
		resultsTable[year][finalRoundRound + 3][1] = { team: (results[year][index - 1].winningTeam == results[year][index - 1].hTeam ? results[year][index - 1].aTeam : results[year][index - 1].hTeam) }

		//Updates all other teams 3rd - 10th for this round, they did not take part in this round, so they keep the same position
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
	getTeamResults: getTeamResults,
	getVenues: getVenues
}
