const TEAMS_MIN_DENSITY_COEFFICIANT = 0.5
const TEAMS_EQUAL_DENSITY_COEFFICIANT = 0.5

exports.desiredFitness = 40

exports.fitness = scheduelingOption => {
	const assignments = scheduelingOption.assignments()

	const teamSchedueles = assignments.reduce((schedueles, assignment) => {
		schedueles[assignment.team.number] = schedueles[assignment.team.number] || []
		schedueles[assignment.team.number].push(assignment)
		return schedueles
	}, { })

	// team grade between 0 and 1, where 1 is the best and 0 is the worst
	const teamGrades = Object.values(teamSchedueles).map(teamAssignments => {
		const slots = teamAssignments.map(assignment => assignment.slot)
			.sort((slot1, slot2) => slot1.start - slot2.start)

		const breaks = [slots[0].start]
		for(let i = 0; i < slots.length - 1; i++) {
			const current = slots[i]
			const next = slots[i+1]
			breaks.push(next.start - current.end)
		}

		const meanBreak = breaks.reduce((sum, break0) => sum + break0, 0) / breaks.length
		const breaksDensity = breaks.reduce((sum, break0) => sum + Math.abs(break0 - meanBreak), 0) / (meanBreak * breaks.length)

		return breaksDensity
	})

	if (teamGrades.some(grade => isNaN(grade))) {
		return 1
	}

	const meanGrade = teamGrades.reduce((sum, grade) => sum + grade, 0) / teamGrades.length
	const gradeInequality = teamGrades.reduce((sum, grade) => sum + Math.abs(grade - meanGrade), 0) / teamGrades.length

	const totalGrade = TEAMS_EQUAL_DENSITY_COEFFICIANT * gradeInequality + TEAMS_MIN_DENSITY_COEFFICIANT * meanGrade

	return 100 * totalGrade
}
