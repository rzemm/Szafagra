import { resolveVoting } from '../lib/voting.js'

function pickRandom(pool, count, exclude = []) {
  const excludedIds = new Set(exclude.map(song => song.id))
  return [...pool.filter(song => !excludedIds.has(song.id))]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

export function replaceSongInOptions(options, removedSong, allSongs, alreadyUsed = []) {
  const usedIds = new Set([removedSong.id, ...alreadyUsed.map(s => s.id)])
  const keys = Object.keys(options).sort()
  const result = {}
  for (const key of keys) {
    const songs = (options[key] ?? []).filter(s => s.id !== removedSong.id)
    if (songs.length < (options[key] ?? []).length) {
      const inResult = Object.values(result).flat()
      const pool = allSongs.filter(s =>
        !usedIds.has(s.id) &&
        !inResult.some(r => r.id === s.id) &&
        !songs.some(e => e.id === s.id)
      )
      if (pool.length > 0) {
        const pick = pool[Math.floor(Math.random() * pool.length)]
        songs.push(pick)
        usedIds.add(pick.id)
      }
    }
    result[key] = songs
  }
  return result
}

export function replaceVotingOption(options, removedKey, allSongs, alreadyUsed = [], groupSize = 1) {
  const usedIds = new Set(alreadyUsed.map(s => s.id))
  const otherSongs = Object.entries(options)
    .filter(([k]) => k !== removedKey)
    .flatMap(([, songs]) => songs)
  const pool = allSongs
    .filter(s => !usedIds.has(s.id) && !otherSongs.some(o => o.id === s.id))
    .sort(() => Math.random() - 0.5)
  return { ...options, [removedKey]: pool.slice(0, groupSize) }
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

export function finalizeAdvanceState({
  state,
  nextState,
  voteMode = 'highest',
  voteThreshold = 1,
  queueSize = 1,
  skippedSongIds = [],
}) {
  if (!state || !nextState) return null

  const skipped = new Set(skippedSongIds)
  const queueLengthBeforeAdvance = (state.queue ?? []).length
  let newQueue = nextState.queue ?? []
  let newOptions = nextState.nextOptions ?? {}
  let newVotes = nextState.nextVotes ?? {}

  if (queueLengthBeforeAdvance <= voteThreshold && Object.keys(newOptions).length > 0) {
    const keys = Object.keys(newOptions).sort()
    const winnerKey = chooseWinningOption(keys, newVotes, voteMode)
    const winnerSongs = (newOptions[winnerKey] ?? []).filter((song) => !skipped.has(song.id))
    newQueue = [...newQueue, ...winnerSongs]
    newOptions = {}
    newVotes = {}
  }

  if (Object.keys(newOptions).length === 0) {
    const used = [nextState.currentSong, ...newQueue].filter(Boolean)
    const generated = generateVotingOptions(state, queueSize, used)
    newOptions = generated.nextOptions
    newVotes = generated.nextVotes
  }

  return {
    currentSong: nextState.currentSong,
    queue: newQueue,
    nextOptions: newOptions,
    nextVotes: newVotes,
  }
}

export function buildImmediatePlayState(state, song) {
  const existingQueue = state?.queue ?? []
  const alreadyUsed = [song, ...existingQueue].filter(Boolean)
  const newOptions = replaceSongInOptions(state?.nextOptions ?? {}, song, state?.songs ?? [], alreadyUsed)

  return {
    currentSong: song,
    queue: existingQueue,
    nextOptions: newOptions,
    nextVotes: {},
  }
}

export function buildQueuedState(state, song) {
  const newQueue = [...(state?.queue ?? []), song]
  const alreadyUsed = [state?.currentSong, ...newQueue].filter(Boolean)
  const newOptions = replaceSongInOptions(state?.nextOptions ?? {}, song, state?.songs ?? [], alreadyUsed)

  return {
    queue: newQueue,
    nextOptions: newOptions,
  }
}

export function replaceOptionSong(options, allSongs, currentSong, queue, optionKey, song) {
  const alreadyUsed = [currentSong, ...(queue ?? [])].filter(Boolean)
  const usedIds = new Set([
    ...alreadyUsed.map((entry) => entry.id),
    ...Object.values(options ?? {}).flat().map((entry) => entry.id),
  ])
  const pool = (allSongs ?? []).filter((entry) => !usedIds.has(entry.id))
  const pick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null

  return (options?.[optionKey] ?? []).map((entry) => (
    entry.id === song.id ? (pick ?? entry) : entry
  ))
}

export function buildOptionRemovalState(state, optionKey, groupSize = 1) {
  const alreadyUsed = [state?.currentSong, ...(state?.queue ?? [])].filter(Boolean)
  const nextOptions = replaceVotingOption(
    state?.nextOptions ?? {},
    optionKey,
    state?.songs ?? [],
    alreadyUsed,
    groupSize,
  )
  const nextVotes = Object.fromEntries(
    Object.entries(state?.nextVotes ?? {}).filter(([, value]) => value !== optionKey)
  )

  return { nextOptions, nextVotes }
}

export function buildInitialPlaybackState(state, queueSize = 1) {
  const shuffled = [...(state?.songs ?? [])].sort(() => Math.random() - 0.5)
  const first = shuffled[0]
  const initialQueue = queueSize > 1 ? shuffled.slice(1, queueSize) : []
  const generated = generateVotingOptions(state, queueSize, [first, ...initialQueue])

  return {
    currentSong: first,
    queue: initialQueue,
    nextOptions: generated.nextOptions,
    nextVotes: generated.nextVotes,
  }
}

export function buildAdvanceToOptionState(state, optionKey, skippedSongIds = []) {
  const skipped = new Set(skippedSongIds)
  const songs = ((state?.nextOptions ?? {})[optionKey] ?? []).filter((song) => !skipped.has(song.id))
  if (!songs.length) return null

  const [currentSong, ...queue] = songs
  return {
    currentSong,
    queue,
    nextOptions: {},
    nextVotes: {},
  }
}

export function resizeOptions(options, songs, currentSong, queue, newSize) {
  const keys = Object.keys(options ?? {}).sort()
  if (keys.length === 0) return {}

  const currentMaxSize = Math.max(...keys.map((key) => (options[key] ?? []).length))
  const nextOptions = {}

  if (newSize <= currentMaxSize) {
    for (const key of keys) {
      nextOptions[key] = (options[key] ?? []).slice(0, newSize)
    }
    return nextOptions
  }

  const usedIds = new Set([
    currentSong?.id,
    ...(queue ?? []).map((song) => song.id),
    ...keys.flatMap((key) => (options[key] ?? []).map((song) => song.id)),
  ].filter(Boolean))

  const pool = [...(songs ?? []).filter((song) => !usedIds.has(song.id))].sort(() => Math.random() - 0.5)
  let poolIdx = 0

  for (const key of keys) {
    const current = options[key] ?? []
    const needed = Math.max(0, newSize - current.length)
    const extra = pool.slice(poolIdx, poolIdx + needed)
    poolIdx += needed
    nextOptions[key] = [...current, ...extra]
  }

  return nextOptions
}
