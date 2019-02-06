
function doTimesIntersects (time1, time2) {
	return time1.start < time2.end && time2.start < time1.end
}

class ScheduelingOption {

	constructor (emptyScheduele) {
		this.emptyScheduele = emptyScheduele
	}

	generateDNA () {
		this.dna = new Array(this.emptyScheduele.sessions.length)

		const unassignedSessions = this.emptyScheduele.sessions.slice()
		const avaiableSlots = this.emptyScheduele.slots.slice()
		const teamUnavailabilities = {}

		while (unassignedSessions.length > 0) {
			// select a random session and get its index. The index in the DNA array will be the index of the session.
			const session = unassignedSessions.splice(Math.floor(Math.random() * unassignedSessions.length), 1)[0]
			const sessionIndex = this.emptyScheduele.sessions.indexOf(session)

			// Make sure teamUnavilabilities has the session's team
			teamUnavailabilities[session.team.number] = teamUnavailabilities[session.team.number] || []

			// Find possible slots for the session
			const optionalSlots = avaiableSlots.filter(slot => {
				return slot.type === session.session.requiredSlotType &&
					teamUnavailabilities[session.team.number].every(unavilability => !doTimesIntersects(unavilability, slot))
			})

			// If the team has no place for more sessions clear its scheduele and retry
			if(optionalSlots.length === 0) {
				teamUnavailabilities[session.team.number].forEach(unavilability => {
					avaiableSlots.push(this.dna[unavilability.sessionIndex])
					this.dna[unavilability.sessionIndex] = null
					unassignedSessions.push(this.emptyScheduele.sessions[unavilability.sessionIndex])
				})
				unassignedSessions.push(session)
				teamUnavailabilities[session.team.number] = []
				continue
			}

			// Select a random slot from the available ones
			const slot = optionalSlots.splice(Math.floor(Math.random() * optionalSlots.length), 1)[0]

			teamUnavailabilities[session.team.number].push(Object.assign(this.bufferedSlot(slot), { sessionIndex }))

			this.dna[sessionIndex] = slot
		}
	}

	mutate (mutateProbability) {
		for(let sessionIndex1 = 0; sessionIndex1 < this.emptyScheduele.sessions.length; sessionIndex1++) {
			if(Math.random() < mutateProbability) {
				let session1 = this.emptyScheduele.sessions[sessionIndex1]
				let optinalSessions2 = this.emptyScheduele.sessions
					.filter((session, index) => session.session.slotType === session1.slotType && this.canSwitch(sessionIndex1, index))
				if (optinalSessions2.length !== 0) {
					let session2 = optinalSessions2[Math.floor(Math.random() * optinalSessions2.length)]
					let sessionIndex2 = this.emptyScheduele.sessions.indexOf(session2)
					let temp = this.dna[sessionIndex1]
					this.dna[sessionIndex1] = this.dna[sessionIndex2]
					this.dna[sessionIndex2] = temp
				}
			}
		}
	}

	canSwitch (sessionIndex1, sessionIndex2) {
		const session1 = this.emptyScheduele.sessions[sessionIndex1]
		const session2 = this.emptyScheduele.sessions[sessionIndex2]

		const slot1 = this.dna[sessionIndex1]
		const slot2 = this.dna[sessionIndex2]

		return !slot1 || !slot2 || this.teamFreeOn(session1.team, slot2, session1) && this.teamFreeOn(session2.team, slot1, session2)
	}

	teamFreeOn (team, slot, sessionToIgnore) {
		const teamUnavailableTimes = this.emptyScheduele.sessions
			.map((session, index) => session.team === team && session !== sessionToIgnore ? index : -1)
			.filter(index => index !== -1)
			.map(sessionIndex => this.dna[sessionIndex])
			.filter(s => !!s)
			.map(s => this.bufferedSlot(s))

		return teamUnavailableTimes.every(unavailableTime => !doTimesIntersects(unavailableTime, slot))
	}

	bufferedSlot (slot) {
		return {
			start: slot.start - this.emptyScheduele.teamBreaksMinimumLength,
			end: slot.end + this.emptyScheduele.teamBreaksMinimumLength
		}
	}

	assignments () {
		return this.dna.map((slot, sessionIndex) => {
			return {
				slot,
				team: this.emptyScheduele.sessions[sessionIndex].team,
				session: this.emptyScheduele.sessions[sessionIndex].session
			}
		})
	}

	teams () {
		return this.emptyScheduele.teams
	}

	tables () {
		return this.emptyScheduele.tables
	}

	rankingMatches () {
		return this.assignments().filter(assignment => assignment.session.stage === 'ranking')
	}

	startTime () {
		return new Date(`01/01/2000 ${this.emptyScheduele.startTime}`)
	}

}

function buildCycle(DNAPool, startingIndex) {
	const startingNode = DNAPool[startingIndex]
	const cycle = []
	let currentNode = startingNode
	do {
		cycle.push(currentNode)
		currentNode = nextNode(DNAPool, currentNode)
	} while(currentNode !== startingNode)
	return cycle
}

function nextSlot(DNAPool, node) {
	return DNAPool.find(({ slot1 }) => slot1 === node.slot2)
}

ScheduelingOption.cross = (scheduelingOption1, scheduelingOption2) => {
	const emptyScheduele = scheduelingOption1.emptyScheduele
	const finalDNA = []

	const DNAPool = scheduelingOption1.dna
		.map((slot, index) => ({ index, slot1: slot, slot2: scheduelingOption1.dna[index] }))
	
	const DNAConflictCycles = []
	const usedIndeces = []
	let foundSomeMatches = false
	DNAPool.forEach(({ slot1, slot2, index }) => {
		if(slot1 === slot2) {
			finalDNA[index] = slot1
			foundSomeMatches = true
		} else if (!usedIndeces.includes(index)) {
			const cycle = buildCycle(DNAPool, index)
			usedIndeces = usedIndeces.concat(cycle.map(node => node.index))
			DNAConflictCycles.push(cycle)
		}
	})

	if(DNAConflictCycles.length === 1) {
		throw new Error('Incompatible options to merge')
	} else if (DNAConflictCycles.length > 1) {
		DNAConflictCycles.forEach(cycle => {
			let sourceKey = Math.random() < 0.5 ? 'slot1' : 'slot2'
			cycle.forEach(node => finalDNA[node.index] = node[sourceKey])
		})
	}

	const result = new ScheduelingOption(emptyScheduele)
	result.dna = finalDNA
	return result
}

module.exports = ScheduelingOption
