// Predefined time periods for work range calculations
const timePeriods = [
  {
    name: 'days',
    value: totalDays => totalDays,
    emoji: '📅'
  },
  {
    name: 'lunar months',
    value: totalDays => Math.floor(totalDays / 29.53), // Average lunar cycle
    emoji: '🌙'
  },
  {
    name: 'Mars sols',
    value: totalDays => Math.floor(totalDays / 1.027), // Mars day is ~24h 37m
    emoji: '🔴'
  },
  {
    name: 'Venus days',
    value: totalDays => Math.floor(totalDays / 243), // Venus day is 243 Earth days
    emoji: '🌕'
  },
  {
    name: 'housefly lifespans',
    value: totalDays => Math.floor(totalDays / 28), // Housefly lives ~28 days
    emoji: '🪰'
  },
  {
    name: 'mayfly lifespans',
    value: totalDays => Math.floor(totalDays / 1), // Mayflies live ~1 day
    emoji: '🦋'
  },
  {
    name: 'dog years equivalent',
    value: totalDays => Math.floor(totalDays / 52.14), // 1 dog year ≈ 52.14 human days
    emoji: '🐕'
  },
  {
    name: 'pizza delivery times',
    value: totalDays => Math.floor((totalDays * 24 * 60) / 30), // 30 minutes per pizza
    emoji: '🍕'
  },
  {
    name: 'coffee breaks',
    value: totalDays => Math.floor((totalDays * 24 * 60) / 15), // 15-minute coffee breaks
    emoji: '☕'
  },
  {
    name: 'blinks of an eye',
    value: totalDays => Math.floor((totalDays * 24 * 60 * 60) / 0.1), // 0.1 seconds per blink
    emoji: '👁️'
  },
  // Movie references
  {
    name: 'Groundhog Day loops',
    value: totalDays => Math.floor(totalDays / 1), // Bill Murray reliving the same day
    emoji: '🐿️'
  },
  {
    name: 'Matrix red pill moments',
    value: totalDays => Math.floor((totalDays * 24 * 60) / 136), // The Matrix runtime
    emoji: '💊'
  },
  // Classic references
  {
    name: 'Roman consulships',
    value: totalDays => Math.floor(totalDays / 365), // Roman consuls served 1 year terms
    emoji: '🏛️'
  },
  {
    name: 'Olympic cycles',
    value: totalDays => Math.floor(totalDays / (4 * 365.25)), // Olympics every 4 years
    emoji: '🏅'
  },
  // Alien/sci-fi themed
  {
    name: 'Zeta Reticuli orbits',
    value: totalDays => Math.floor(totalDays / (132 * 365.25)), // Hypothetical alien star system
    emoji: '👽'
  },
  {
    name: 'UFO sighting reports',
    value: totalDays => Math.floor(totalDays / 7), // Average UFO reports per week
    emoji: '🛸'
  }
]

module.exports = timePeriods
