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

function time(startTime, timeOffsetInMinutes) {
	const time = new Date(startTime.getTime() + timeOffsetInMinutes * 60 * 1000)
	let hours = time.getHours() % 12
	if(hours < 10) { hours = `0${hours}` }
	let minutes = time.getMinutes()
	if(minutes < 10) { minutes = `0${minutes}` }
	let seconds = time.getSeconds()
	if(seconds < 10) { seconds = `0${seconds}` }
	return `${hours}:${minutes}:${seconds} ${time.getHours() < 12 ? 'AM' : 'PM'}`
}

function block(format, lines) {
	return [['Block Format', format]].concat(lines)
}

function csvAssignmentsLines(assignments, startTime, span) {
	return assignments
		.reduce((lines, assignment) => {
			let line = lines.find(l => l.start === assignment.slot.start)
			if (line) {
				line.teams.push(assignment.team.number)
			} else {
				lines.push({ start: assignment.slot.start, end: assignment.slot.sart + span, teams: [assignment.team.number] })
			}
			return lines
		}, [])
		.sort((assignment1, assignment2) => assignment1.start - assignment2.start)
		.map((line, index) => [index + 1 ,time(startTime, line.start), time(startTime, line.end)].concat(line.teams))
}

function roomBlock({ roomType, assignments, roomsCount }, startTime, roomSpan) {
	const lines = csvAssignmentsLines(assignments, startTime, roomSpan)
	const header = [
		['Number of Event Time Slots', lines.length],
		['Number of Judging Teams', roomsCount],
		['Event Name', roomType]
	]
	return header.concat(lines)
}

const FILE_PART_FUNCTIONS = [
	function header(scheduele) {
		return [['Version Number', '1']]
	},
	function teams(scheduele) {
		return block(1, [['Number of Teams', scheduele.teams().length]].concat(scheduele.teams().map(team => [team.number, team.name])))
	},
	function rankings(scheduele) {
		const lines = csvAssignmentsLines(scheduele.rankingMatches(), scheduele.startTime(), scheduele.matchSpan())
		const header = [
			['Number of Ranking Matches', lines.length],
			['Number of Tables', scheduele.tables().length / 2],
			['Number of Teams Per Table', 2],
			['Number of Simultaneous Tables', scheduele.tables().length / 4],
			['Table Names'].concat(scheduele.tables())
		]
		return block(2, header.concat(lines))
	},
	function judgesRooms(scheduele) {
		const roomsAssignments = scheduele.roomsAssignments()
		const header = [
			['Number of Judged Events', roomsAssignments.length]
		]
		return block(3, header.concat(roomsAssignments.reduce((lines, roomAssignments) =>
			lines.concat(roomBlock(roomAssignments, scheduele.startTime(), scheduele.roomSpan())), [])))
	},
	function practice(scheduele) {
		const lines = csvAssignmentsLines(scheduele.practiceMatches(), scheduele.startTime(), scheduele.matchSpan())
		const header = [
			['Number of Practice Matches', lines.length],
			['Number of Tables', scheduele.tables().length / 2],
			['Number of Teams Per Table', 2],
			['Number of Simultaneous Tables', scheduele.tables().length / 4],
			['Table Names'].concat(scheduele.tables())
		]
		return block(4, header.concat(lines))
	}
]

exports.writeCSV = (scheduele, filePath) => {
	const fileValues = FILE_PART_FUNCTIONS.reduce((values, filePartFunction) =>
		values.concat(filePartFunction(scheduele))
	, [])
	return save(filePath, fileValues)
}
