const fs = require('fs')
const https = require('https')
let env

try {
  env = require('./env.local.json')
} catch {
  env = require('./env.process.js')
}

if (Object.values(env).filter(Boolean).length !== Object.values(env).length) {
  const emptyKeys = Object.entries(env)
    .filter(([, v]) => !v)
    .map(([k]) => k)
  throw new Error(`Next env keys are empty: ${emptyKeys.join(', ')}`)
}

const tokens = [
  { token: 'WORK RANGE', fn: workRange },
  { token: 'FUN FACT', fn: funFact },
  { token: 'YOUTUBE', fn: youtubePlaylist },
]

;(async () => {
  try {
    const readmeFilePath = './README.md'
    const readmeOriginal = fs.readFileSync(readmeFilePath, 'utf8')

    const readmeUpdated = await tokens.reduce(async (accPromise, { token, fn }) => {
      try {
        const acc = await accPromise
        const rp = new RegExp(`(<!--${token}:START-->)(.*)(<!--${token}:END-->)`, 's')
        const match = acc.match(rp)
        if (!match) {
          console.warn(`Warning: Token ${token} not found in README.md`)
          return acc
        }
        const oldValue = match[2]
        const replacedToken = await fn(oldValue)
        return acc.replace(rp, `$1${replacedToken}$3`)
      } catch (error) {
        console.error(`Error processing token ${token}:`, error.message)
        // Return the accumulator unchanged if there's an error with this token
        return accPromise
      }
    }, Promise.resolve(readmeOriginal))

    fs.writeFileSync(readmeFilePath, readmeUpdated)
    console.log(`${readmeFilePath} updated!`)
  } catch (error) {
    console.error('Failed to update README:', error.message)
    process.exit(1)
  }
})()

function workRange() {
  const ONE_DAY = 24 * 60 * 60 * 1000
  const startedToWork = new Date(2011, 7, 11)
  const today = new Date()
  const totalDays = Math.floor((today - startedToWork) / ONE_DAY)

  // Fun time period calculations
  const timePeriods = [
    {
      name: 'days',
      value: totalDays,
      emoji: '📅'
    },
    {
      name: 'lunar months',
      value: Math.floor(totalDays / 29.53), // Average lunar cycle
      emoji: '🌙'
    },
    {
      name: 'Mars sols',
      value: Math.floor(totalDays / 1.027), // Mars day is ~24h 37m
      emoji: '🔴'
    },
    {
      name: 'Venus days',
      value: Math.floor(totalDays / 243), // Venus day is 243 Earth days
      emoji: '🌕'
    },
    {
      name: 'housefly lifespans',
      value: Math.floor(totalDays / 28), // Housefly lives ~28 days
      emoji: '🪰'
    },
    {
      name: 'mayfly lifespans',
      value: Math.floor(totalDays / 1), // Mayflies live ~1 day
      emoji: '🦋'
    },
    {
      name: 'dog years equivalent',
      value: Math.floor(totalDays / 52.14), // 1 dog year ≈ 52.14 human days
      emoji: '🐕'
    },
    {
      name: 'pizza delivery times',
      value: Math.floor((totalDays * 24 * 60) / 30), // 30 minutes per pizza
      emoji: '🍕'
    },
    {
      name: 'coffee breaks',
      value: Math.floor((totalDays * 24 * 60) / 15), // 15-minute coffee breaks
      emoji: '☕'
    },
    {
      name: 'blinks of an eye',
      value: Math.floor((totalDays * 24 * 60 * 60) / 0.1), // 0.1 seconds per blink
      emoji: '👁️'
    },
    // Movie references
    {
      name: 'Groundhog Day loops',
      value: Math.floor(totalDays / 1), // Bill Murray reliving the same day
      emoji: '🐿️'
    },
    {
      name: 'Matrix red pill moments',
      value: Math.floor((totalDays * 24 * 60) / 136), // The Matrix runtime
      emoji: '💊'
    },
    // Classic references
    {
      name: 'Roman consulships',
      value: Math.floor(totalDays / 365), // Roman consuls served 1 year terms
      emoji: '🏛️'
    },
    {
      name: 'Olympic cycles',
      value: Math.floor(totalDays / (4 * 365.25)), // Olympics every 4 years
      emoji: '🏅'
    },
    // Alien/sci-fi themed
    {
      name: 'Zeta Reticuli orbits',
      value: Math.floor(totalDays / (132 * 365.25)), // Hypothetical alien star system
      emoji: '👽'
    },
    {
      name: 'UFO sighting reports',
      value: Math.floor(totalDays / 7), // Average UFO reports per week
      emoji: '🛸'
    }
  ]

  // Randomly pick 3 periods (always include days as first)
  const randomPeriods = [timePeriods[0]] // Always include days
  const otherPeriods = timePeriods.slice(1).filter(period => period.value > 0)
  
  // Shuffle and pick 2 more random periods
  for (let i = otherPeriods.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [otherPeriods[i], otherPeriods[j]] = [otherPeriods[j], otherPeriods[i]]
  }
  randomPeriods.push(...otherPeriods.slice(0, 2))

  // Create a fun, expandable string
  const funnyPeriods = randomPeriods
    .map(period => `${period.value.toLocaleString()} ${period.name} ${period.emoji}`)
    .join(', ')

  return Promise.resolve(`, which is ${funnyPeriods}!`)
}

async function funFact(oldValue = '') {
  try {
    const json = await getJson('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')
    
    // Validate response structure for APIv2
    if (!json || !json.text) {
      console.error('Invalid fun fact API response structure:', json)
      return oldValue || 'API temporarily unavailable'
    }
    
    return json.text
  } catch (error) {
    console.error('Failed to fetch fun fact:', error.message)
    return oldValue || 'API temporarily unavailable'
  }
}

async function youtubePlaylist(oldTable) {
  const NEW_LINE = '\n'
  const API_KEY = env.YOUTUBE_API_KEY
  const MAX_RESULTS = 25
  const playlistId = 'PLXjYtHFptm-1_AvljZv_EHBHO_BaqvVsH'

  // Validate API key
  if (!API_KEY) {
    console.error('YouTube API key is missing. Keeping existing table content.')
    return oldTable
  }

  const [thead, divider] = oldTable.trim().split(NEW_LINE)
  
  try {
    const json = await getJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&part=contentDetails&maxResults=${MAX_RESULTS}&playlistId=${playlistId}&key=${API_KEY}`)

    // Validate API response structure
    if (!json || !json.items || !Array.isArray(json.items)) {
      console.error('Invalid YouTube API response structure:', json)
      console.error('Keeping existing table content.')
      return oldTable
    }

    if (json.error) {
      console.error('YouTube API returned an error:', json.error)
      console.error('Keeping existing table content.')
      return oldTable
    }

    const videosAsMarkdownRows = json.items
      .filter(({ snippet }) => snippet && snippet.thumbnails && Object.keys(snippet.thumbnails).length)
      .map(({ snippet, contentDetails }) => {
        // Validate required fields
        if (!snippet.resourceId?.videoId || !snippet.title || !contentDetails?.videoPublishedAt) {
          console.warn('Skipping video with missing required fields:', { snippet, contentDetails })
          return null
        }
        
        return {
          publishedAt: contentDetails.videoPublishedAt,
          title: snippet.title,
          link: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`,
          thumbnail: snippet.thumbnails.default
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => a.publishedAt > b.publishedAt ? -1 : 1)
      .map(({ publishedAt, title, link, thumbnail }, i) => {
        const date = new Date(publishedAt)
        const options = { year: 'numeric', month: 'long', day: 'numeric' };

        return [
          '',
          i+1,
          date.toLocaleDateString('en-US', options),
          `<img src="${thumbnail.url}" width="${thumbnail.width}" height="${thumbnail.height}" />`,
          `[${title}](${link})`
        ].join(' | ').trim()
      })

    console.log(`Downloaded ${videosAsMarkdownRows.length} videos from youtube`)

    const newTable = [
      '', // for new line before the table
      thead,
      divider,
      videosAsMarkdownRows.join(NEW_LINE),
      '' // for new line after the table
    ].join(NEW_LINE)

    return Promise.resolve(newTable)
  } catch (error) {
    console.error('Failed to fetch YouTube playlist:', error.message)
    console.error('Keeping existing table content.')
    return oldTable
  }
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = ''

      res.on('data', chunk => body += chunk)

      res.on('end', () => {
        console.log(`API Response status: ${res.statusCode}`)
        
        if (res.statusCode !== 200) {
          console.error(`API request failed with status ${res.statusCode}`)
          console.error('Response body:', body)
          reject(new Error(`HTTP ${res.statusCode}: ${body}`))
          return
        }

        try {
          const json = JSON.parse(body)
          resolve(json)
        } catch (error) {
          console.error('Failed to parse JSON response:')
          console.error('Response body:', body)
          console.error('Parse error:', error.message)
          reject(new Error(`JSON Parse Error: ${error.message}. Response was: ${body.substring(0, 200)}...`))
        }
      })
    }).on('error', (error) => {
      console.error('Network error:', error.message)
      reject(new Error(`Network Error: ${error.message}`))
    })
  })
}