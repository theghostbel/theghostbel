// Dynamic commit messages for automated README updates

const workDurationMessages = [
  "Day {totalDays}: Still coding, still caffeinated ☕",
  "Another day, another commit ({totalDays} days and counting) 🚀",
  "Automated update after {totalDays} days of dedication 💪",
  "Day {totalDays}: The grind continues ⚡",
  "Still here after {totalDays} days - README needs love 💝",
  "Day {totalDays}: Robots don't take sick days 🤖",
  "Persistence level: {totalDays} days strong 🔥",
  "Day {totalDays}: Code never sleeps 😴",
  "Another milestone: {totalDays} days of commits 🎯",
  "Day {totalDays}: Because consistency matters 📈"
]

const funnyMessages = [
  "The robots are working while I sleep 🤖",
  "Beep boop - automated awesomeness deployed 🔄",
  "Daily dose of algorithmic magic ✨",
  "README.md demands attention, robots comply 📝",
  "Another day, another algorithmic update 🔄",
  "Scheduled maintenance: keeping things fresh 🌱",
  "The machines are learning... to update READMEs 🧠",
  "Automation: because humans forget things 🤷",
  "Your friendly neighborhood GitHub bot reporting 🕷️",
  "Warning: Excessive automation detected 🚨"
]

const timestampMessages = [
  "Daily refresh: {date} automation ⏰",
  "Scheduled update for {date} ✅",
  "Morning coffee for the README: {date} ☕",
  "{date}: Another day, another automated update 📅",
  "Fresh content delivery: {date} 🚚",
  "Daily maintenance completed: {date} 🔧",
  "{date} status: All systems updating normally 💚",
  "Clockwork precision: {date} refresh ⚙️",
  "{date}: Keeping the lights on 💡",
  "Regular scheduled programming: {date} 📺"
]

function getCommitMessage(totalDays) {
  // Combine all message arrays
  const allMessages = [
    ...workDurationMessages,
    ...funnyMessages,
    ...timestampMessages
  ]
  
  // Randomly select a message
  const randomIndex = Math.floor(Math.random() * allMessages.length)
  const selectedMessage = allMessages[randomIndex]
  
  // Format current date
  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
  
  // Replace placeholders
  const finalMessage = selectedMessage
    .replace('{totalDays}', totalDays.toLocaleString())
    .replace('{date}', formattedDate)
  
  return finalMessage
}

module.exports = { getCommitMessage }