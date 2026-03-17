import { resolveVoting } from './voting'

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
  return resolveVoting(keys, votes, voteMode).winnerKey
}

export function formatTime(sec) {
  if (sec == null) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
