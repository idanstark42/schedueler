module.exports = class EmptyScheduele {

	constructor (options) {
		Object.assign(this, options)

		this.calculateJudingSystem()
		this.calculateUnschedueledSessions()
		this.calculateEmptySlots()
		this.validate()
	}

	calculateJudingSystem () {
		this.roomsPerTeam = Object.keys(this.rooms)
		this.allRooms = Object.entries(this.rooms).reduce((allRooms, [room, count]) => {
			return allRooms.concat(new Array(count).fill(room))
		}, [])
	}

	calculateUnschedueledSessions () {
		this.sessions = []
		
		this.sessionsPerTeam = []
		this.roomsPerTeam.forEach(roomType => {
			this.sessionsPerTeam.push({ requiredSlotType: roomType })
		})
		Object.entries(this.matchesPerTeam).forEach(([stage, rounds]) => {
			for (let round = 1; round <= rounds; round++) {
				this.sessionsPerTeam.push({ requiredSlotType: `${stage} #${round}`, stage })
			}
		})

		this.teams.forEach(team => { 
			this.sessionsPerTeam.forEach(sessionPerTeam => {
				this.sessions.push({ team, session: sessionPerTeam })
			})
		})
	}

	calculateEmptySlots () {
		this.slots = []
		this.roomsSchedueleSections.forEach(roomsSchedueleSection => {
			for(let time = roomsSchedueleSection.start; time <= roomsSchedueleSection.end - this.roomCycle; time += this.roomCycle) {
				this.allRooms.forEach((roomType, i) => {
					this.slots.push({ start: time, end: time + this.roomCycle, type: roomType, slot: `${roomType} ${i+1}` })
				})
			}
		})
		Object.entries(this.matchesSchedueleSections).forEach(([stage, stageSchedueleSections]) => {
			stageSchedueleSections.forEach((matchesSchedueleSection, index) => {
				const round = index + 1
				for(let time = matchesSchedueleSection.start; time <= matchesSchedueleSection.end - this.matchCycle; time += this.matchCycle) {
					for(let i = 0; i < this.tables.length; i++) {
						this.slots.push({ start: time, end: time + this.matchCycle, type: `${stage} #${round}`, stage, slot: `Table ${i+1}` })
					}
				}
			})
		})
	}

	validate () {
		if (this.slots.length < this.sessions.length) {
			throw new Error(`Missing ${this.sessions.length - this.slots.length} slots`)
		}
	}

}