'use strict'

const CROSS_PROBABILITY = 0.7
const MUTATION_PROBABILITY = 0.005
const POPULATION_SIZE = 200
const MAX_GENERATIONS = 1000

exports.Population = class Population {

	constructor ({ ChromosomeClass, chromosomeInput, fitness, desiredFitness }) {
		this.fitness = fitness
		this.desiredFitness = desiredFitness
		this.ChromosomeClass = ChromosomeClass
		this.currentGeneration = []
		this.gen = 1
		for (let i = 0; i < POPULATION_SIZE; i++) {
			const chromosome = new ChromosomeClass(chromosomeInput)
			chromosome.generateDNA()
			this.currentGeneration.push(chromosome)
			process.stdout.write('.')
		}
		console.log()
		this.calculateFitness()
	}

	run () {
		console.log(`Searching for grade ${this.desiredFitness} or ${MAX_GENERATIONS} iterations.`)
		while(this.gen < MAX_GENERATIONS && this.alpha.fitness < this.desiredFitness) {
			this.advanceGeneration()
		}
		return this.alpha
	}

	advanceGeneration () {
		const nextGeneneration = []
		while (nextGeneneration.length < this.currentGeneration.length - 1) {
			if (Math.random() < CROSS_PROBABILITY) {
				const father = this.rulleteSelect()
				const mother = this.rulleteSelect(c => c !== father)
				nextGeneneration.push(this.ChromosomeClass.cross(father, mother))
			} else {
				nextGeneneration.push(this.rulleteSelect())
			}
		}

		nextGeneneration.forEach(chromosome => chromosome.mutate(MUTATION_PROBABILITY))

		// Pushing alpha without mutating it
		nextGeneneration.push(this.alpha)

		this.currentGeneration = nextGeneneration
		this.gen++
		this.calculateFitness()
	}

	calculateFitness () {
		this.alpha = undefined
		this.omega = undefined
		this.currentGeneration.forEach(chromosome => {
			chromosome.fitness = this.fitness(chromosome, this)
			if (this.alpha === undefined || chromosome.fitness > this.alpha.fitness) {
				this.alpha = chromosome
			}
			if (this.omega === undefined || chromosome.fitness < this.omega.fitness) {
				this.omega = chromosome
			}
		})
		console.log(`#${this.gen}			alpha: ${this.alpha.fitness}			omega: ${this.omega.fitness}`)
	}

	rulleteSelect (filters=(()=>true)) {
		const possibleChromosomes = this.currentGeneration.filter(filters)
		const sumOfFitnesses = possibleChromosomes.reduce((sum, chromosome) => sum + chromosome.fitness, 0)
		let index = Math.random() * sumOfFitnesses
		for(let chromosome of possibleChromosomes) {
			if(index <= 0) {
				return chromosome
			}
			index -= chromosome.fitness
		}
		return possibleChromosomes[possibleChromosomes.length - 1]
	}

}
