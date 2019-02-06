const path = require('path')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))

const { scheduele } = require('./lib/schedueler')
const { writeCSV } = require('./lib/csv_formatting')

console.log('Init...')
fs.readFileAsync(path.resolve(__dirname, '.', 'dev', 'input.json'), 'utf8').then(fileContent => {
	const input = JSON.parse(fileContent)
	console.log('Starting...')
	const output = scheduele(input)
	writeCSV(output, path.resolve(__dirname, '.', 'dev', 'output.csv')).then(() => {
		console.log('Done.')
	})
})
