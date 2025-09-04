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
  const daysCount = Math.floor((today - startedToWork) / ONE_DAY)

  return Promise.resolve(`, ${daysCount} days!`)
}

async function funFact(oldValue = '') {
  try {
    const json = await getJson('https://uselessfacts.jsph.pl/random.json?language=en')
    
    // Validate response structure
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