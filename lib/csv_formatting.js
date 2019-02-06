const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))

const LINE_LENGTH = 7

// values is a 1d array
function line(lineValues) {
	const arr = new Array(LINE_LENGTH)
	lineValues.forEach((value, index) => { arr[index] = value })
	return arr.join()
}

// values is a 2d array
function csv(fileValues) {
	return fileValues.map(line).join('\r\n')
}

// values is a 2d array
function save(filePath, values) {
	return fs.writeFileAsync(filePath, csv(values), 'utf8')
}

function time(startTime, matchTimeOffsetInMinutes) {
	return new Date(startTime.getTime() + matchTimeOffsetInMinutes * 60 * 1000).toLocaleTimeString() 
}

function block(format, lines) {
	return [['Block Format', format]].concat(lines)
}

function csvMatches(matches, startTime) {
	return matches.map((match, index) => [index + 1, time(startTime, match.slot.start), time(startTime, match.slot.end), match.session.team.number])
}

const FILE_PART_FUNCTIONS = [
	function header(scheduele) {
		return [['Version Number', '1']]
	},
	function teams(scheduele) {
		return block(1, [['Number of Teams', scheduele.teams().length]].concat(scheduele.teams().map(team => [team.number, team.name])))
	},
	function rankings(scheduele) {
		const rankingMatches = scheduele.rankingMatches()
		const header = [
			['Number of Ranking Matches', rankingMatches.length],
			['Number of Tables', scheduele.tables().length / 2],
			['Number of Teams Per Table', 2],
			['Number of Simultaneous Tables', scheduele.tables().length / 4],
			['Table Names'].concat(scheduele.tables())
		]
		return block(2, header.concat(csvMatches(rankingMatches, scheduele.startTime())))
	}
]

exports.writeCSV = (scheduele, filePath) => {
	let values = []
	FILE_PART_FUNCTIONS.forEach(filePartFunction => { values = values.concat(filePartFunction(scheduele)) })
	return save(filePath, values)
}
