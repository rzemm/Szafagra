import { useCallback, useEffect, useRef, useState } from 'react'
import { chooseWinningOption, generateVotingOptions, moveToNextTrack, replaceSongInOptions, replaceVotingOption } from '../domain/jukebox'
import { incrementRoomPlays, patchMainState, setMainState, updatePlaybackSync } from '../services/jukeboxService'
import { useYouTubePlayer } from './useYouTubePlayer'

export function useJukeboxPlayback({ authReady, canEditRoom, roomId, room, settings }) {
  const [timerTick, setTimerTick] = useState(0)

  const prevSongIdRef = useRef(null)
  const errorGuardRef = useRef({ lastSongId: null, lastAt: 0 })
  const skippedSongIdsRef = useRef(new Set())
  const skipAdvancePendingRef = useRef(false)
  const advanceToWinnerRef = useRef(async () => {})
  const liveRef = useRef({})

  const isPlaying = room?.isPlaying ?? false
  const currentSong = room?.currentSong ?? null
  const queueSize = Math.max(1, settings?.queueSize ?? 1)
  const voteMode = settings?.voteMode ?? 'highest'
  const nextOptions = room?.nextOptions ?? {}
  const nextOptionKeys = Object.keys(nextOptions).sort()

  useEffect(() => {
    liveRef.current = { room, roomId, settings }
  }, [room, roomId, settings])

  const handlePlayerPlaying = useCallback((player) => {
    const duration = Math.round(player?.getDuration?.() ?? 0)
    const position = Math.round(player?.getCurrentTime?.() ?? 0)
    const liveRoomId = liveRef.current.roomId

    if (!liveRoomId || duration <= 0) return

    const update = { syncPos: position }
    if (!liveRef.current.room?.duration) update.duration = duration
    updatePlaybackSync(liveRoomId, update).catch(() => {})
  }, [])

  const handlePlayerEnded = useCallback(() => {
    advanceToWinnerRef.current()
  }, [])

  const handlePlayerError = useCallback((code) => {
    const song = liveRef.current.room?.currentSong
    if (![2, 5, 100, 101, 150].includes(code)) return

    const now = Date.now()
    if (song?.id && errorGuardRef.current.lastSongId === song.id && now - errorGuardRef.current.lastAt < 3000) return

    errorGuardRef.current = { lastSongId: song?.id ?? null, lastAt: now }
    if (song?.id) skippedSongIdsRef.current.add(song.id)
    advanceToWinnerRef.current()
  }, [])

  const {
    playerDivRef,
    playerRef,
    isReady: playerReady,
    ytPlayerState,
    loadProgress,
    loadVideoById,
    stopVideo,
  } = useYouTubePlayer({
    enabled: canEditRoom && authReady && !!room,
    currentVideoId: room?.isPlaying ? room?.currentSong?.ytId : null,
    onPlaying: handlePlayerPlaying,
    onEnded: handlePlayerEnded,
    onRecoverableError: handlePlayerError,
  })

  const nowMs = timerTick || room?.syncAt?.toMillis?.() || 0
  const remaining = isPlaying && room?.syncAt && room?.duration
    ? Math.max(0, room.duration - (room.syncPos ?? 0) - ((nowMs - room.syncAt.toMillis()) / 1000))
    : null

  const advanceToWinner = useCallback(async () => {
    const { room: liveRoom, roomId: rid, settings: roomSettings } = liveRef.current
    if (!liveRoom || !rid) return

    const vMode = roomSettings?.voteMode ?? 'highest'
    const threshold = roomSettings?.voteThreshold ?? 1
    const queueSz = Math.max(1, roomSettings?.queueSize ?? 1)
    const queueLengthBeforeAdvance = (liveRoom.queue ?? []).length

    const nextState = moveToNextTrack({
      state: liveRoom,
      voteMode: vMode,
      skippedSongIds: [...skippedSongIdsRef.current],
    })
    if (!nextState) return

    let newQueue = nextState.queue ?? []
    let newOptions = nextState.nextOptions ?? {}
    let newVotes = nextState.nextVotes ?? {}

    if (queueLengthBeforeAdvance <= threshold && Object.keys(newOptions).length > 0) {
      const keys = Object.keys(newOptions).sort()
      const winnerKey = chooseWinningOption(keys, newVotes, vMode)
      const winnerSongs = (newOptions[winnerKey] ?? []).filter(song => !skippedSongIdsRef.current.has(song.id))
      newQueue = [...newQueue, ...winnerSongs]
      newOptions = {}
      newVotes = {}
    }

    if (Object.keys(newOptions).length === 0) {
      const used = [nextState.currentSong, ...newQueue].filter(Boolean)
      const generated = generateVotingOptions(liveRoom, queueSz, used)
      newOptions = generated.nextOptions
      newVotes = generated.nextVotes
    }

    prevSongIdRef.current = nextState.currentSong.id
    loadVideoById(nextState.currentSong.ytId)
    incrementRoomPlays(rid).catch(() => {})

    await setMainState(rid, {
      isPlaying: true,
      currentSong: nextState.currentSong,
      queue: newQueue,
      nextOptions: newOptions,
      nextVotes: newVotes,
      skipVoters: {},
      syncPos: 0,
      duration: null,
    })
  }, [loadVideoById])

  useEffect(() => {
    advanceToWinnerRef.current = advanceToWinner
  }, [advanceToWinner])

  useEffect(() => {
    if (!isPlaying || ytPlayerState === 2 || !room?.syncAt || !room?.duration) return
    const timeoutId = setTimeout(() => {
      setTimerTick(Date.now())
    }, 0)
    const intervalId = setInterval(() => {
      setTimerTick(Date.now())
    }, 1000)
    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [isPlaying, room?.duration, room?.syncAt, ytPlayerState])

  const playSongNow = useCallback(async (song) => {
    if (!roomId || !room) return

    prevSongIdRef.current = song.id
    loadVideoById(song.ytId)
    incrementRoomPlays(roomId).catch(() => {})

    const existingQueue = room.queue ?? []
    const alreadyUsed = [song, ...existingQueue].filter(Boolean)
    const newOptions = replaceSongInOptions(room.nextOptions ?? {}, song, room.songs ?? [], alreadyUsed)

    await setMainState(roomId, {
      isPlaying: true,
      currentSong: song,
      queue: existingQueue,
      nextOptions: newOptions,
      nextVotes: {},
      skipVoters: {},
      syncPos: 0,
      duration: null,
    })
  }, [loadVideoById, room, roomId])

  const queueSong = useCallback(async (song) => {
    if (!roomId || !room) return

    const newQueue = [...(room.queue ?? []), song]
    const alreadyUsed = [room.currentSong, ...newQueue].filter(Boolean)
    const newOptions = replaceSongInOptions(room.nextOptions ?? {}, song, room.songs ?? [], alreadyUsed)

    await patchMainState(roomId, {
      queue: newQueue,
      nextOptions: newOptions,
    })
  }, [room, roomId])

  const removeFromQueue = useCallback(async (songId) => {
    if (!roomId || !room) return
    const newQueue = (room.queue ?? []).filter((s) => s.id !== songId)
    await patchMainState(roomId, { queue: newQueue })
  }, [room, roomId])

  const removeVotingOption = useCallback(async (optionKey) => {
    if (!roomId || !room) return

    const alreadyUsed = [room.currentSong, ...(room.queue ?? [])].filter(Boolean)
    const newOptions = replaceVotingOption(room.nextOptions ?? {}, optionKey, room.songs ?? [], alreadyUsed, queueSize)
    const newVotes = Object.fromEntries(
      Object.entries(room.nextVotes ?? {}).filter(([, v]) => v !== optionKey)
    )

    await patchMainState(roomId, { nextOptions: newOptions, nextVotes: newVotes })
  }, [room, roomId, queueSize])

  useEffect(() => {
    if (!canEditRoom || !isPlaying || !room || !roomId) return
    if (nextOptionKeys.length > 0) return
    if (!room.songs?.length) return
    const used = [currentSong, ...(room.queue ?? [])].filter(Boolean)
    const generated = generateVotingOptions(room, queueSize, used)
    patchMainState(roomId, {
      nextOptions: generated.nextOptions,
      nextVotes: generated.nextVotes,
    }).catch(() => {})
  }, [canEditRoom, currentSong, isPlaying, nextOptionKeys.length, queueSize, room, roomId])

  useEffect(() => {
    if (!canEditRoom || !isPlaying) return
    const threshold = settings?.skipThreshold ?? 0
    if (threshold <= 0) return
    const count = Object.keys(room?.skipVoters ?? {}).length
    if (count >= threshold && !skipAdvancePendingRef.current) {
      skipAdvancePendingRef.current = true
      advanceToWinner().finally(() => {
        skipAdvancePendingRef.current = false
      })
    }
  }, [advanceToWinner, canEditRoom, isPlaying, room?.skipVoters, settings?.skipThreshold])

  useEffect(() => {
    if (!canEditRoom || !room?.isPlaying || !room?.currentSong) return
    const { id, ytId } = room.currentSong
    if (prevSongIdRef.current === id) return
    prevSongIdRef.current = id
    loadVideoById(ytId)
  }, [canEditRoom, loadVideoById, room?.currentSong, room?.isPlaying])

  const startJukebox = useCallback(async () => {
    if (!room?.songs?.length || !roomId) return
    const shuffled = [...room.songs].sort(() => Math.random() - 0.5)
    const first = shuffled[0]
    const initialQueue = queueSize > 1 ? shuffled.slice(1, queueSize) : []

    prevSongIdRef.current = first.id
    loadVideoById(first.ytId)
    incrementRoomPlays(roomId).catch(() => {})

    const generated = generateVotingOptions(room, queueSize, [first, ...initialQueue])

    await setMainState(roomId, {
      isPlaying: true,
      currentSong: first,
      queue: initialQueue,
      nextOptions: generated.nextOptions,
      nextVotes: generated.nextVotes,
      skipVoters: {},
      syncPos: 0,
      duration: null,
    })
  }, [loadVideoById, queueSize, room, roomId])

  const stopJukebox = useCallback(async () => {
    if (!roomId || !room) return
    await patchMainState(roomId, {
      isPlaying: false,
    })
    prevSongIdRef.current = null
    stopVideo()
  }, [room, roomId, stopVideo])

  const advanceToOption = useCallback(async (key) => {
    const { room: liveRoom, roomId: rid } = liveRef.current
    if (!liveRoom || !rid) return

    const songs = ((liveRoom.nextOptions ?? {})[key] ?? []).filter(song => !skippedSongIdsRef.current.has(song.id))
    if (!songs.length) return

    const [current, ...queue] = songs
    prevSongIdRef.current = current.id
    loadVideoById(current.ytId)

    await setMainState(rid, {
      isPlaying: true,
      currentSong: current,
      queue,
      nextOptions: {},
      nextVotes: {},
      skipVoters: {},
      syncPos: 0,
      duration: null,
    })
  }, [loadVideoById])

  const resizeVotingOptions = useCallback(async (newSize) => {
    const { room: liveRoom, roomId: rid } = liveRef.current
    if (!liveRoom || !rid) return
    const options = liveRoom.nextOptions ?? {}
    const keys = Object.keys(options).sort()
    if (keys.length === 0) return

    const currentMaxSize = Math.max(...keys.map(k => (options[k] ?? []).length))
    const newOptions = {}

    if (newSize <= currentMaxSize) {
      for (const key of keys) {
        newOptions[key] = (options[key] ?? []).slice(0, newSize)
      }
    } else {
      const usedIds = new Set([
        liveRoom.currentSong?.id,
        ...(liveRoom.queue ?? []).map(s => s.id),
        ...keys.flatMap(k => (options[k] ?? []).map(s => s.id)),
      ].filter(Boolean))

      const pool = [...(liveRoom.songs ?? []).filter(s => !usedIds.has(s.id))].sort(() => Math.random() - 0.5)
      let poolIdx = 0

      for (const key of keys) {
        const current = options[key] ?? []
        const needed = Math.max(0, newSize - current.length)
        const extra = pool.slice(poolIdx, poolIdx + needed)
        poolIdx += needed
        newOptions[key] = [...current, ...extra]
      }
    }

    await patchMainState(rid, { nextOptions: newOptions })
  }, [])

  return {
    playerDivRef,
    playerReady,
    ytPlayerState,
    loadProgress,
    remaining,
    playSongNow,
    queueSong,
    removeFromQueue,
    removeVotingOption,
    advanceToWinner,
    advanceToOption,
    resizeVotingOptions,
    startJukebox,
    stopJukebox,
    playerRef,
    voteMode,
  }
}
