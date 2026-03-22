import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildAdvanceToOptionState,
  buildImmediatePlayState,
  buildInitialPlaybackState,
  buildOptionRemovalState,
  buildQueuedState,
  finalizeAdvanceState,
  generateVotingOptions,
  moveToNextTrack,
  replaceOptionSong,
  resizeOptions,
} from '../domain/jukebox'
import { incrementRoomPlays, patchMainState, setMainState, updatePlaybackSync } from '../services/jukeboxService'
import { useYouTubePlayer } from './useYouTubePlayer'

export function useJukeboxPlayback({ authReady, canEditRoom, isViewMode, roomId, room, settings }) {
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
    enabled: (canEditRoom || isViewMode) && authReady && !!room,
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

    const nextState = moveToNextTrack({
      state: liveRoom,
      voteMode: roomSettings?.voteMode ?? 'highest',
      skippedSongIds: [...skippedSongIdsRef.current],
    })
    if (!nextState) return

    const finalized = finalizeAdvanceState({
      state: liveRoom,
      nextState,
      voteMode: roomSettings?.voteMode ?? 'highest',
      voteThreshold: roomSettings?.voteThreshold ?? 1,
      queueSize: Math.max(1, roomSettings?.queueSize ?? 1),
      skippedSongIds: [...skippedSongIdsRef.current],
    })
    if (!finalized) return

    prevSongIdRef.current = finalized.currentSong.id
    loadVideoById(finalized.currentSong.ytId)
    incrementRoomPlays(rid).catch(() => {})

    await setMainState(rid, {
      isPlaying: true,
      currentSong: finalized.currentSong,
      queue: finalized.queue,
      nextOptions: finalized.nextOptions,
      nextVotes: finalized.nextVotes,
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

    const nextState = buildImmediatePlayState(room, song)
    await setMainState(roomId, {
      isPlaying: true,
      currentSong: nextState.currentSong,
      queue: nextState.queue,
      nextOptions: nextState.nextOptions,
      nextVotes: nextState.nextVotes,
      skipVoters: {},
      syncPos: 0,
      duration: null,
    })
  }, [loadVideoById, room, roomId])

  const queueSong = useCallback(async (song) => {
    if (!roomId || !room) return

    const nextState = buildQueuedState(room, song)
    await patchMainState(roomId, nextState)
  }, [room, roomId])

  const removeFromQueue = useCallback(async (songId) => {
    if (!roomId || !room) return
    const newQueue = (room.queue ?? []).filter((song) => song.id !== songId)
    await patchMainState(roomId, { queue: newQueue })
  }, [room, roomId])

  const replaceSong = useCallback(async (optionKey, song) => {
    if (!roomId || !room) return
    const newGroup = replaceOptionSong(
      room.nextOptions ?? {},
      room.songs ?? [],
      room.currentSong,
      room.queue ?? [],
      optionKey,
      song,
    )
    await patchMainState(roomId, {
      nextOptions: { ...(room.nextOptions ?? {}), [optionKey]: newGroup },
    })
  }, [room, roomId])

  const removeVotingOption = useCallback(async (optionKey) => {
    if (!roomId || !room) return

    const nextState = buildOptionRemovalState(room, optionKey, queueSize)
    await patchMainState(roomId, nextState)
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

    const initialState = buildInitialPlaybackState(room, queueSize)
    if (!initialState.currentSong) return

    prevSongIdRef.current = initialState.currentSong.id
    loadVideoById(initialState.currentSong.ytId)
    incrementRoomPlays(roomId).catch(() => {})

    await setMainState(roomId, {
      isPlaying: true,
      currentSong: initialState.currentSong,
      queue: initialState.queue,
      nextOptions: initialState.nextOptions,
      nextVotes: initialState.nextVotes,
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

    const nextState = buildAdvanceToOptionState(liveRoom, key, [...skippedSongIdsRef.current])
    if (!nextState) return

    prevSongIdRef.current = nextState.currentSong.id
    loadVideoById(nextState.currentSong.ytId)

    await setMainState(rid, {
      isPlaying: true,
      currentSong: nextState.currentSong,
      queue: nextState.queue,
      nextOptions: nextState.nextOptions,
      nextVotes: nextState.nextVotes,
      skipVoters: {},
      syncPos: 0,
      duration: null,
    })
  }, [loadVideoById])

  const resizeVotingOptions = useCallback(async (newSize) => {
    const { room: liveRoom, roomId: rid } = liveRef.current
    if (!liveRoom || !rid) return

    const nextOptionsState = resizeOptions(
      liveRoom.nextOptions ?? {},
      liveRoom.songs ?? [],
      liveRoom.currentSong,
      liveRoom.queue ?? [],
      newSize,
    )
    if (Object.keys(nextOptionsState).length === 0) return

    await patchMainState(rid, { nextOptions: nextOptionsState })
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
    replaceSong,
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
