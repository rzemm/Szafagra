import { useCallback, useEffect, useRef, useState } from 'react'
import { chooseWinningOption, generateVotingOptions, moveToNextTrack } from '../domain/jukebox'
import { patchMainState, setMainState, updatePlaybackSync } from '../services/jukeboxService'
import { useYouTubePlayer } from './useYouTubePlayer'

export function useJukeboxPlayback({ authReady, isOwner, roomId, playlists, settings, jukeboxState, activePlaylistId, selectPlaylist }) {
  const [timerTick, setTimerTick] = useState(0)

  const prevSongIdRef = useRef(null)
  const errorGuardRef = useRef({ lastSongId: null, lastAt: 0 })
  const skippedSongIdsRef = useRef(new Set())
  const skipAdvancePendingRef = useRef(false)
  const advanceToWinnerRef = useRef(async () => {})
  const liveRef = useRef({})

  const isPlaying = jukeboxState?.isPlaying ?? false
  const currentSong = jukeboxState?.currentSong ?? null
  const queueSize = Math.max(1, settings?.queueSize ?? 1)
  const voteMode = settings?.voteMode ?? 'highest'
  const nextOptions = jukeboxState?.nextOptions ?? {}
  const nextOptionKeys = Object.keys(nextOptions).sort()
  const nowMs = timerTick || jukeboxState?.syncAt?.toMillis?.() || 0
  const remaining = isPlaying && jukeboxState?.syncAt && jukeboxState?.duration
    ? Math.max(0, jukeboxState.duration - (jukeboxState.syncPos ?? 0) - ((nowMs - jukeboxState.syncAt.toMillis()) / 1000))
    : null

  useEffect(() => {
    liveRef.current = { jukeboxState, roomId, playlists, settings }
  }, [jukeboxState, roomId, playlists, settings])

  const handlePlayerPlaying = useCallback((player) => {
    const duration = Math.round(player?.getDuration?.() ?? 0)
    const position = Math.round(player?.getCurrentTime?.() ?? 0)
    const liveRoomId = liveRef.current.roomId

    if (!liveRoomId || duration <= 0) return

    const update = { syncPos: position }
    if (!liveRef.current.jukeboxState?.duration) update.duration = duration
    updatePlaybackSync(liveRoomId, update).catch(() => {})
  }, [])

  const handlePlayerEnded = useCallback(() => {
    advanceToWinnerRef.current()
  }, [])

  const handlePlayerError = useCallback((code) => {
    const song = liveRef.current.jukeboxState?.currentSong
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
    ytPlayerState,
    loadProgress,
    loadVideoById,
    stopVideo,
  } = useYouTubePlayer({
    enabled: isOwner && authReady,
    currentVideoId: jukeboxState?.isPlaying ? jukeboxState?.currentSong?.ytId : null,
    onPlaying: handlePlayerPlaying,
    onEnded: handlePlayerEnded,
    onRecoverableError: handlePlayerError,
  })

  const advanceToWinner = useCallback(async () => {
    const { jukeboxState: state, roomId: rid, settings: roomSettings, playlists: pls } = liveRef.current
    if (!state || !rid) return

    const vMode = roomSettings?.voteMode ?? 'highest'
    const threshold = roomSettings?.voteThreshold ?? 1
    const queueSz = Math.max(1, roomSettings?.queueSize ?? 1)

    // Capture queue length BEFORE advance — this is what the user sees in "Zaraz zagra"
    const queueLengthBeforeAdvance = (state.queue ?? []).length

    const nextState = moveToNextTrack({
      state,
      voteMode: vMode,
      skippedSongIds: [...skippedSongIdsRef.current],
    })
    if (!nextState) return

    let newQueue = nextState.queue ?? []
    let newOptions = nextState.nextOptions ?? {}
    let newVotes = nextState.nextVotes ?? {}

    // Proactively resolve voting when queue gets short enough
    // Compare against pre-advance length so threshold matches what user sees in "Zaraz zagra"
    if (queueLengthBeforeAdvance <= threshold && Object.keys(newOptions).length > 0) {
      const keys = Object.keys(newOptions).sort()
      const winnerKey = chooseWinningOption(keys, newVotes, vMode)
      const winnerSongs = (newOptions[winnerKey] ?? []).filter(song => !skippedSongIdsRef.current.has(song.id))
      newQueue = [...newQueue, ...winnerSongs]
      newOptions = {}
      newVotes = {}
    }

    // Always ensure we have voting options ready for users
    if (Object.keys(newOptions).length === 0) {
      const playlist = pls.find(p => p.id === nextState.activePlaylistId)
      const used = [nextState.currentSong, ...newQueue].filter(Boolean)
      const { nextOptions: no, nextVotes: nv } = generateVotingOptions(playlist, queueSz, used)
      newOptions = no
      newVotes = nv
    }

    prevSongIdRef.current = nextState.currentSong.id
    loadVideoById(nextState.currentSong.ytId)

    await setMainState(rid, {
      isPlaying: true,
      activePlaylistId: nextState.activePlaylistId,
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
    if (!isPlaying || !jukeboxState?.syncAt || !jukeboxState?.duration) return
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
  }, [isPlaying, jukeboxState?.syncAt, jukeboxState?.duration])

  const playSongNow = useCallback(async (song) => {
    if (!roomId) return
    const pid = activePlaylistId ?? jukeboxState?.activePlaylistId
    const playlist = playlists.find(p => p.id === pid)

    prevSongIdRef.current = song.id
    loadVideoById(song.ytId)

    const { nextOptions: no, nextVotes: nv } = generateVotingOptions(playlist, queueSize, [song])
    await setMainState(roomId, {
      isPlaying: true,
      activePlaylistId: pid,
      currentSong: song,
      queue: [],
      nextOptions: no,
      nextVotes: nv,
      skipVoters: {},
      syncPos: 0,
      duration: null,
    })
  }, [activePlaylistId, jukeboxState?.activePlaylistId, loadVideoById, playlists, queueSize, roomId])

  // Safety net: generate voting options if somehow none exist
  useEffect(() => {
    if (!isOwner || !isPlaying || !jukeboxState || !roomId) return
    if (nextOptionKeys.length > 0) return
    const playlist = playlists.find(p => p.id === jukeboxState.activePlaylistId)
    if (!playlist?.songs.length) return
    const used = [currentSong, ...(jukeboxState.queue ?? [])].filter(Boolean)
    const { nextOptions: no, nextVotes: nv } = generateVotingOptions(playlist, queueSize, used)
    patchMainState(roomId, { nextOptions: no, nextVotes: nv }).catch(() => {})
  }, [isOwner, isPlaying, jukeboxState, roomId, nextOptionKeys.length, playlists, queueSize, currentSong])

  useEffect(() => {
    if (!isOwner || !isPlaying) return
    const threshold = settings?.skipThreshold ?? 0
    if (threshold <= 0) return
    const count = Object.keys(jukeboxState?.skipVoters ?? {}).length
    if (count >= threshold && !skipAdvancePendingRef.current) {
      skipAdvancePendingRef.current = true
      advanceToWinner().finally(() => {
        skipAdvancePendingRef.current = false
      })
    }
  }, [advanceToWinner, isOwner, isPlaying, settings?.skipThreshold, jukeboxState?.skipVoters])

  useEffect(() => {
    if (!isOwner || !jukeboxState?.isPlaying || !jukeboxState?.currentSong) return
    const { id, ytId } = jukeboxState.currentSong
    if (prevSongIdRef.current === id) return
    prevSongIdRef.current = id
    loadVideoById(ytId)
  }, [isOwner, jukeboxState?.isPlaying, jukeboxState?.currentSong, loadVideoById])

  const startJukeboxWith = useCallback(async (pid) => {
    const playlist = playlists.find(p => p.id === pid)
    if (!playlist?.songs.length || !roomId) return
    selectPlaylist(pid)
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5)
    const first = shuffled[0]
    const initialQueue = queueSize > 1 ? shuffled.slice(1, queueSize) : []

    prevSongIdRef.current = first.id
    loadVideoById(first.ytId)

    const { nextOptions: no, nextVotes: nv } = generateVotingOptions(playlist, queueSize, [first, ...initialQueue])

    await setMainState(roomId, {
      isPlaying: true,
      activePlaylistId: pid,
      currentSong: first,
      queue: initialQueue,
      nextOptions: no,
      nextVotes: nv,
      skipVoters: {},
      syncPos: 0,
      duration: null,
    })
  }, [loadVideoById, playlists, queueSize, roomId, selectPlaylist])

  const stopJukebox = useCallback(async () => {
    if (!roomId || !jukeboxState) return
    await patchMainState(roomId, {
      isPlaying: false,
    })
    prevSongIdRef.current = null
    stopVideo()
  }, [jukeboxState, roomId, stopVideo])

  const advanceToOption = useCallback(async (key) => {
    const { jukeboxState: state, roomId: rid } = liveRef.current
    if (!state || !rid) return

    const songs = ((state.nextOptions ?? {})[key] ?? []).filter(song => !skippedSongIdsRef.current.has(song.id))
    if (!songs.length) return

    const [currentSong, ...queue] = songs
    prevSongIdRef.current = currentSong.id
    loadVideoById(currentSong.ytId)

    await setMainState(rid, {
      isPlaying: true,
      activePlaylistId: state.activePlaylistId,
      currentSong,
      queue,
      nextOptions: {},
      nextVotes: {},
      skipVoters: {},
      syncPos: 0,
      duration: null,
    })
  }, [loadVideoById])

  const resizeVotingOptions = useCallback(async (newSize) => {
    const { jukeboxState: state, roomId: rid, playlists: pls } = liveRef.current
    if (!state || !rid) return
    const options = state.nextOptions ?? {}
    const keys = Object.keys(options).sort()
    if (keys.length === 0) return

    const currentMaxSize = Math.max(...keys.map(k => (options[k] ?? []).length))
    const newOptions = {}

    if (newSize <= currentMaxSize) {
      // Decrease: trim each option
      for (const key of keys) {
        newOptions[key] = (options[key] ?? []).slice(0, newSize)
      }
    } else {
      // Increase: add more random songs to each option
      const usedIds = new Set([
        state.currentSong?.id,
        ...(state.queue ?? []).map(s => s.id),
        ...keys.flatMap(k => (options[k] ?? []).map(s => s.id)),
      ].filter(Boolean))

      const playlist = pls.find(p => p.id === state.activePlaylistId)
      const pool = [...(playlist?.songs ?? []).filter(s => !usedIds.has(s.id))].sort(() => Math.random() - 0.5)
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
    ytPlayerState,
    loadProgress,
    remaining,
    playSongNow,
    advanceToWinner,
    advanceToOption,
    resizeVotingOptions,
    startJukeboxWith,
    stopJukebox,
    playerRef,
    voteMode,
  }
}
