import { resolveVoting } from '../lib/voting'

function pickRandom(pool, count, exclude = []) {
  const excludedIds = new Set(exclude.map(song => song.id))
  return [...pool.filter(song => !excludedIds.has(song.id))]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

export function chooseWinningOption(keys, votes, voteMode) {
  return resolveVoting(keys, votes, voteMode).winnerKey
}

export function generateVotingOptions(playlist, groupSize, exclude = []) {
  const nextOptions = {}
  const used = [...exclude]
  for (let i = 0; i < 3; i++) {
    const songs = pickRandom(playlist?.songs ?? [], groupSize, used)
    nextOptions[String(i)] = songs
    used.push(...songs)
  }
  return { nextOptions, nextVotes: {} }
}

export function moveToNextTrack({ state, voteMode = 'highest', skippedSongIds = [] }) {
  if (!state) return null
  const skipped = new Set(skippedSongIds)
  const validQueue = (state.queue ?? []).filter(song => !skipped.has(song.id))

  if (validQueue.length > 0) {
    const [currentSong, ...queue] = validQueue
    return {
      currentSong,
      queue,
      nextOptions: state.nextOptions ?? {},
      nextVotes: state.nextVotes ?? {},
    }
  }

  const options = state.nextOptions ?? {}
  const votes = state.nextVotes ?? {}
  const keys = Object.keys(options).sort()
  if (!keys.length) return null

  const winnerKey = chooseWinningOption(keys, votes, voteMode)
  const winnerSongs = (options[winnerKey] ?? []).filter(song => !skipped.has(song.id))
  if (!winnerSongs.length) return null

  const [currentSong, ...queue] = winnerSongs
  return {
    currentSong,
    queue,
    nextOptions: {},
    nextVotes: {},
  }
}
