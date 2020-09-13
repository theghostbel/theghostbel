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
  const readmeFilePath = './README.md'
  const readmeOriginal = fs.readFileSync(readmeFilePath, 'utf8')

  const readmeUpdated = await tokens.reduce(async (accPromise, { token, fn }) => {
    const acc = await accPromise
    const rp = new RegExp(`(<!--${token}:START-->)(.*)(<!--${token}:END-->)`, 's')
    const oldValue = acc.match(rp)[2]
    const replacedToken = await fn(oldValue)
    return acc.replace(rp, `$1${replacedToken}$3`)
  }, Promise.resolve(readmeOriginal))

  fs.writeFileSync(readmeFilePath, readmeUpdated)
  console.log(`${readmeFilePath} updated!`)
})()

function workRange() {
  const ONE_DAY = 24 * 60 * 60 * 1000
  const startedToWork = new Date(2011, 7, 11)
  const today = new Date()
  const daysCount = Math.floor((today - startedToWork) / ONE_DAY)

  return Promise.resolve(`, ${daysCount} days!`)
}

async function funFact() {
  const { text } = await getJson('https://uselessfacts.jsph.pl/random.json?language=en')
  return text
}

async function youtubePlaylist(oldTable) {
  const NEW_LINE = '\n'
  const API_KEY = env.YOUTUBE_API_KEY
  const MAX_RESULTS = 25
  const playlistId = 'PLXjYtHFptm-1_AvljZv_EHBHO_BaqvVsH'

  const [thead, divider] = oldTable.trim().split(NEW_LINE)
  const json = await getJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&part=contentDetails&maxResults=${MAX_RESULTS}&playlistId=${playlistId}&key=${API_KEY}`)

  const videosAsMarkdownRows = json.items
    .map(({ snippet, contentDetails }) => {
      return {
        publishedAt: contentDetails.videoPublishedAt,
        title: snippet.title,
        link: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`,
        thumbnail: snippet.thumbnails.default
      }
    })
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
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = ''

      res.on('data', chunk => body += chunk)

      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          resolve(json)
        } catch (error) {
          console.error(error.message)
          reject(error.message)
        }
      })
    }).on('error', (error) => {
      reject(error.message)
    })
  })
}