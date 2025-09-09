const https = require('https')
const timePeriods = require('./timePeriods')

async function generateTimePeriods(totalDays, env) {
  if (!env.OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key not found, using fallback periods')
    return null
  }

  // Get 3 random examples from existing time periods for the prompt
  const availablePeriods = timePeriods.slice(1) // Skip 'days' as it's always first
  const shuffled = [...availablePeriods].sort(() => Math.random() - 0.5)
  const randomExamples = shuffled.slice(0, 3)
  
  const examplePeriods = randomExamples.map(period => {
    const sampleDays = 1000
    const result = period.value(sampleDays)
    const unitDays = result > 0 ? sampleDays / result : 1
    const roundedDays = Number(unitDays.toFixed(3))
    return `- ${period.name}: ${roundedDays} days per unit ${period.emoji}`
  }).join('\n')

  const prompt = `Suggest 3 creative time units with their durations in days. I'll do the math locally.

EXISTING EXAMPLES:
${examplePeriods}

YOUR TASK: Provide 3 NEW creative and FUNNY units (not in examples above) with duration in days:

CATEGORIES to choose from (be creative and humorous):
- Absurd animal behaviors (elephant pregnancy: 645 days, penguin courtship: 120 days)
- Food phenomena (avocado ripeness window: 0.5 days, cheese aging: 365 days)  
- Pop culture cycles (viral meme lifespan: 14 days, boy band popularity: 1825 days)
- Human quirks (mid-life crisis: 365 days, New Year's resolution commitment: 21 days)
- Oddly specific events (waiting for pizza delivery on a Friday: 0.04 days)

REQUIREMENTS:
- Unit duration must be between 0.1 and 10000 days
- Names in lowercase plural form and BE FUNNY/MEMORABLE
- Choose absurd, quirky, or hilariously specific units
- DO NOT use any of the example units above in your response  
- Make me laugh while being mathematically useful
- Provide duration in days only (I'll calculate the final number)

Format: [{"name":"unit_name","duration_in_days":number,"emoji":"🎯"}]`

  console.log('🤖 Calling DeepSeek API to generate creative time periods...')
  console.log('📝 Prompt:', prompt)
  
  const startTime = Date.now()

  const requestData = JSON.stringify({
    model: "deepseek/deepseek-chat-v3.1:free",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  })

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('DeepSeek API timeout'))
    }, 10000) // 10 second timeout

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    }

    const req = https.request(options, (res) => {
      let body = ''

      res.on('data', chunk => body += chunk)

      res.on('end', () => {
        clearTimeout(timeout)
        const responseTime = Date.now() - startTime
        console.log(`⏱️ DeepSeek API responded in ${responseTime}ms`)
        
        if (res.statusCode !== 200) {
          console.error(`OpenRouter API failed with status ${res.statusCode}`)
          console.error('Response body:', body)
          reject(new Error(`HTTP ${res.statusCode}: ${body}`))
          return
        }

        try {
          const json = JSON.parse(body)
          if (!json.choices || !json.choices[0] || !json.choices[0].message) {
            throw new Error('Invalid API response structure')
          }

          const content = json.choices[0].message.content.trim()
          console.log('DeepSeek response:', content)
          
          // Try to parse the JSON response
          let periods
          try {
            periods = JSON.parse(content)
          } catch (parseError) {
            // If direct parsing fails, try to extract JSON from markdown code blocks or other wrapping
            let cleanContent = content
            
            // Remove markdown code blocks
            cleanContent = cleanContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '')
            
            // Try parsing the cleaned content
            try {
              periods = JSON.parse(cleanContent)
            } catch (secondParseError) {
              // Last resort: extract JSON array using regex
              const jsonMatch = cleanContent.match(/\[[\s\S]*\]/)
              if (jsonMatch) {
                periods = JSON.parse(jsonMatch[0])
              } else {
                throw parseError
              }
            }
          }

          if (!Array.isArray(periods)) {
            throw new Error('Response is not an array')
          }

          // Validate periods and calculate values locally
          console.log('Raw periods from AI:', periods)
          
          const validPeriods = periods
            .filter(period => {
              const hasRequiredFields = period.name && period.emoji && typeof period.duration_in_days === 'number'
              if (!hasRequiredFields) {
                console.log(`❌ Filtered out (missing fields): ${JSON.stringify(period)}`)
              }
              return hasRequiredFields
            })
            .filter(period => {
              const inValidRange = period.duration_in_days >= 0.1 && period.duration_in_days <= 10000
              if (!inValidRange) {
                console.log(`❌ Filtered out (duration ${period.duration_in_days} not in 0.1-10000 range): ${period.name}`)
              }
              return inValidRange
            })
            .map(period => {
              const calculatedValue = Math.floor(totalDays / period.duration_in_days)
              console.log(`✅ ${period.name}: ${totalDays} ÷ ${period.duration_in_days} = ${calculatedValue}`)
              return {
                name: period.name,
                value: calculatedValue,
                emoji: period.emoji
              }
            })
            .filter(period => {
              const reasonableValue = period.value >= 1 && period.value !== totalDays
              if (!reasonableValue) {
                console.log(`❌ Filtered out (unreasonable value ${period.value}): ${period.name}`)
              }
              return reasonableValue
            })

          console.log(`Generated ${validPeriods.length} valid AI time periods`)
          resolve(validPeriods)
        } catch (error) {
          console.error('Failed to parse DeepSeek response:', error.message)
          console.error('Response content:', body)
          reject(error)
        }
      })
    })

    req.on('error', (error) => {
      clearTimeout(timeout)
      console.error('DeepSeek API request error:', error.message)
      reject(error)
    })

    req.write(requestData)
    req.end()
  })
}

module.exports = { generateTimePeriods }