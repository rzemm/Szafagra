import assert from 'node:assert/strict'
import {
  buildAdvanceToOptionState,
  buildImmediatePlayState,
  buildInitialPlaybackState,
  buildOptionRemovalState,
  buildQueuedState,
  finalizeAdvanceState,
  generateVotingOptions,
  moveToNextTrack,
  resizeOptions,
} from './jukebox.js'

function song(id, title = id) {
  return { id, title, ytId: `yt-${id}`, url: `https://youtu.be/yt-${id}` }
}

function withMockedRandom(value, fn) {
  const originalRandom = Math.random
  Math.random = () => value
  try {
    return fn()
  } finally {
    Math.random = originalRandom
  }
}

function runTest(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

runTest('moveToNextTrack prefers queue before voting options', () => {
  const result = moveToNextTrack({
    state: {
      currentSong: song('current'),
      queue: [song('queued'), song('later')],
      nextOptions: { 0: [song('opt-a')] },
      nextVotes: { user1: '0' },
    },
  })

  assert.equal(result.currentSong.id, 'queued')
  assert.deepEqual(result.queue.map((entry) => entry.id), ['later'])
  assert.deepEqual(result.nextOptions, { 0: [song('opt-a')] })
})

runTest('moveToNextTrack falls back to winning option when queue is empty', () => {
  const result = withMockedRandom(0, () => moveToNextTrack({
    state: {
      queue: [],
      nextOptions: {
        0: [song('a1'), song('a2')],
        1: [song('b1'), song('b2')],
      },
      nextVotes: {
        user1: '1',
        user2: '1',
      },
    },
    voteMode: 'highest',
  }))

  assert.equal(result.currentSong.id, 'b1')
  assert.deepEqual(result.queue.map((entry) => entry.id), ['b2'])
  assert.deepEqual(result.nextOptions, {})
  assert.deepEqual(result.nextVotes, {})
})

runTest('finalizeAdvanceState appends winner songs and regenerates options', () => {
  const result = withMockedRandom(0, () => finalizeAdvanceState({
    state: {
      songs: [song('queued-next'), song('winner-1'), song('winner-2'), song('fresh-1'), song('fresh-2'), song('fresh-3')],
      queue: [song('queued-next')],
    },
    nextState: {
      currentSong: song('queued-next'),
      queue: [],
      nextOptions: {
        0: [song('winner-1'), song('winner-2')],
        1: [song('loser-1')],
      },
      nextVotes: {
        user1: '0',
        user2: '0',
      },
    },
    voteMode: 'highest',
    voteThreshold: 1,
    queueSize: 1,
  }))

  assert.equal(result.currentSong.id, 'queued-next')
  assert.deepEqual(result.queue.map((entry) => entry.id), ['winner-1', 'winner-2'])
  assert.deepEqual(Object.keys(result.nextOptions), ['0', '1', '2'])
  assert.deepEqual(result.nextVotes, {})
})

runTest('buildImmediatePlayState resets votes and removes played song from options', () => {
  const result = withMockedRandom(0, () => buildImmediatePlayState({
    songs: [song('play-now'), song('queue-1'), song('replacement')],
    queue: [song('queue-1')],
    nextOptions: {
      0: [song('play-now')],
      1: [song('queue-1')],
    },
  }, song('play-now')))

  assert.equal(result.currentSong.id, 'play-now')
  assert.deepEqual(result.queue.map((entry) => entry.id), ['queue-1'])
  assert.deepEqual(result.nextVotes, {})
  assert.equal(result.nextOptions[0][0].id, 'replacement')
})

runTest('buildQueuedState appends song to queue and refreshes options', () => {
  const result = withMockedRandom(0, () => buildQueuedState({
    currentSong: song('current'),
    queue: [song('queue-1')],
    songs: [song('current'), song('queue-1'), song('queued-now'), song('replacement')],
    nextOptions: {
      0: [song('queued-now')],
      1: [song('queue-1')],
    },
  }, song('queued-now')))

  assert.deepEqual(result.queue.map((entry) => entry.id), ['queue-1', 'queued-now'])
  assert.equal(result.nextOptions[0][0].id, 'replacement')
})

runTest('buildOptionRemovalState removes votes for deleted option and refills it', () => {
  const result = withMockedRandom(0, () => buildOptionRemovalState({
    currentSong: song('current'),
    queue: [song('queue-1')],
    songs: [song('current'), song('queue-1'), song('fresh-1'), song('fresh-2'), song('fresh-3')],
    nextOptions: {
      0: [song('old-1')],
      1: [song('stay-1')],
    },
    nextVotes: {
      user1: '0',
      user2: '1',
    },
  }, '0', 2))

  assert.deepEqual(result.nextVotes, { user2: '1' })
  assert.equal(result.nextOptions['0'].length, 2)
  assert.deepEqual(result.nextOptions['1'], [song('stay-1')])
})

runTest('buildAdvanceToOptionState skips blocked songs', () => {
  const result = buildAdvanceToOptionState({
    nextOptions: {
      0: [song('skip-me'), song('play-me'), song('then-me')],
    },
  }, '0', ['skip-me'])

  assert.equal(result.currentSong.id, 'play-me')
  assert.deepEqual(result.queue.map((entry) => entry.id), ['then-me'])
  assert.deepEqual(result.nextOptions, {})
})

runTest('resizeOptions trims options when new size is smaller', () => {
  const result = resizeOptions({
    0: [song('a'), song('b'), song('c')],
    1: [song('d'), song('e'), song('f')],
  }, [], null, [], 2)

  assert.deepEqual(result, {
    0: [song('a'), song('b')],
    1: [song('d'), song('e')],
  })
})

runTest('resizeOptions expands options with unused songs when new size is larger', () => {
  const result = withMockedRandom(0, () => resizeOptions({
    0: [song('a')],
    1: [song('b')],
  }, [song('a'), song('b'), song('c'), song('d')], null, [], 2))

  assert.equal(result['0'][0].id, 'a')
  assert.equal(result['1'][0].id, 'b')
  const appendedIds = [result['0'][1].id, result['1'][1].id].sort()
  assert.deepEqual(appendedIds, ['c', 'd'])
  assert.notEqual(result['0'][1].id, result['1'][1].id)
})

runTest('generateVotingOptions returns three groups and empty votes', () => {
  const result = withMockedRandom(0, () => generateVotingOptions({
    songs: [song('a'), song('b'), song('c'), song('d')],
  }, 1))

  assert.deepEqual(Object.keys(result.nextOptions), ['0', '1', '2'])
  assert.deepEqual(result.nextVotes, {})
  assert.equal(Object.values(result.nextOptions).flat().length, 3)
})

runTest('buildInitialPlaybackState picks first track and preloads queue', () => {
  const result = withMockedRandom(0, () => buildInitialPlaybackState({
    songs: [song('a'), song('b'), song('c'), song('d')],
  }, 2))

  assert.ok(result.currentSong)
  assert.equal(result.queue.length, 1)
  assert.deepEqual(Object.keys(result.nextOptions), ['0', '1', '2'])
  const usedIds = new Set([
    result.currentSong.id,
    ...result.queue.map((entry) => entry.id),
    ...Object.values(result.nextOptions).flat().map((entry) => entry.id),
  ])
  assert.equal(usedIds.size, 4)
})
