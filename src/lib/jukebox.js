export function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

function pickRandom(pool, count, exclude = []) {
  const excludedIds = new Set(exclude.map(s => s.id))
  return [...pool.filter(s => !excludedIds.has(s.id))]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

export function generateNextOptions(playlist, groupSize, exclude = []) {
  const nextOptions = {}
  const used = [...exclude]
  for (let i = 0; i < 3; i++) {
    const songs = pickRandom(playlist?.songs ?? [], groupSize, used)
    nextOptions[String(i)] = songs
    used.push(...songs)
  }
  return { nextOptions, nextVotes: {} }
}

export function resolveOption(keys, votes, voteMode) {
  if (!keys.length) return null
  const counts = Object.fromEntries(keys.map(k => [k, 0]))
  for (const vote of Object.values(votes)) {
    if (vote in counts) counts[vote]++
  }
  if (voteMode === 'weighted') {
    const weights = keys.map(k => counts[k] + 1)
    const total = weights.reduce((a, b) => a + b, 0)
    let rng = Math.random() * total
    for (let i = 0; i < keys.length; i++) {
      rng -= weights[i]
      if (rng <= 0) return keys[i]
    }
    return keys[keys.length - 1]
  }

  const max = Math.max(...keys.map(k => counts[k]))
  const winners = keys.filter(k => counts[k] === max)
  return winners[Math.floor(Math.random() * winners.length)]
}

export function formatTime(sec) {
  if (sec == null) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
