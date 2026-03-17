import { useEffect, useRef, useState } from 'react'
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { generateNextOptions, resolveOption } from '../lib/jukebox'

const STATE_ID = 'main'

export function useJukeboxPlayback({ authReady, isOwner, roomId, playlists, settings, jukeboxState, activePlaylistId, selectPlaylist }) {
  const [ytPlayerState, setYtPlayerState] = useState(-1)
  const [loadProgress, setLoadProgress] = useState(0)
  const [remaining, setRemaining] = useState(null)

  const playerRef = useRef(null)
  const playerReadyRef = useRef(false)
  const pendingRef = useRef(null)
  const playerDivRef = useRef(null)
  const prevSongIdRef = useRef(null)
  const errorGuardRef = useRef({ lastSongId: null, lastAt: 0 })
  const skippedSongIdsRef = useRef(new Set())
  const loadProgressInterval = useRef(null)
  const skipAdvancePendingRef = useRef(false)
  const liveRef = useRef({})

  const isPlaying = jukeboxState?.isPlaying ?? false
  const currentSong = jukeboxState?.currentSong ?? null
  const queueSize = Math.max(1, settings?.queueSize ?? 1)
  const voteMode = settings?.voteMode ?? 'highest'
  const voteThreshold = settings?.voteThreshold ?? 1
  const nextOptions = jukeboxState?.nextOptions ?? {}
  const nextOptionKeys = Object.keys(nextOptions).sort()

  useEffect(() => {
    liveRef.current = { jukeboxState, roomId, playlists, settings }
  }, [jukeboxState, roomId, playlists, settings])

  useEffect(() => {
    if (!isPlaying || !jukeboxState?.syncAt || !jukeboxState?.duration) {
      setRemaining(null)
      return
    }
    const tick = () => {
      const elapsed = (Date.now() - jukeboxState.syncAt.toMillis()) / 1000
      setRemaining(Math.max(0, jukeboxState.duration - (jukeboxState.syncPos ?? 0) - elapsed))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isPlaying, jukeboxState?.syncAt, jukeboxState?.syncPos, jukeboxState?.duration])

  function playVideo(ytId) {
    if (playerReadyRef.current && playerRef.current) playerRef.current.loadVideoById(ytId)
    else pendingRef.current = ytId
  }

  async function advanceToWinner() {
    const { jukeboxState: state, roomId: rid, playlists: allPlaylists, settings: roomSettings } = liveRef.current
    if (!state || !rid) return

    const skippedIds = skippedSongIdsRef.current
    const queue = state.queue ?? []
    const validQueue = queue.filter(song => !skippedIds.has(song.id))

    if (validQueue.length > 0) {
      const nextSong = validQueue[0]
      prevSongIdRef.current = nextSong.id
      playVideo(nextSong.ytId)
      await setDoc(doc(db, 'rooms', rid, 'state', STATE_ID), {
        isPlaying: true,
        activePlaylistId: state.activePlaylistId,
        currentSong: nextSong,
        queue: validQueue.slice(1),
        nextOptions: state.nextOptions ?? {},
        nextVotes: state.nextVotes ?? {},
        skipVoters: {},
        syncAt: serverTimestamp(),
        syncPos: 0,
        duration: null,
        updatedAt: serverTimestamp(),
      })
      return
    }

    const options = state.nextOptions ?? {}
    const votes = state.nextVotes ?? {}
    const keys = Object.keys(options).sort()
    if (!keys.length) return

    const winKey = resolveOption(keys, votes, roomSettings?.voteMode ?? 'highest')
    const winSongs = (options[winKey] ?? []).filter(song => !skippedIds.has(song.id))
    if (!winSongs.length) return

    const [first, ...rest] = winSongs
    prevSongIdRef.current = first.id
    playVideo(first.ytId)

    await setDoc(doc(db, 'rooms', rid, 'state', STATE_ID), {
      isPlaying: true,
      activePlaylistId: state.activePlaylistId,
      currentSong: first,
      queue: rest,
      nextOptions: {},
      nextVotes: {},
      skipVoters: {},
      syncAt: serverTimestamp(),
      syncPos: 0,
      duration: null,
      updatedAt: serverTimestamp(),
    })
  }

  async function playSongNow(song) {
    if (!roomId) return
    const pid = activePlaylistId ?? jukeboxState?.activePlaylistId
    const playlist = playlists.find(p => p.id === pid)

    prevSongIdRef.current = song.id
    playVideo(song.ytId)

    const { nextOptions: no, nextVotes: nv } = generateNextOptions(playlist, queueSize, [song])
    await setDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying: true,
      activePlaylistId: pid,
      currentSong: song,
      queue: [],
      nextOptions: no,
      nextVotes: nv,
      skipVoters: {},
      syncAt: serverTimestamp(),
      syncPos: 0,
      duration: null,
      updatedAt: serverTimestamp(),
    })
  }

  useEffect(() => {
    if (!isOwner || !isPlaying || !jukeboxState || !roomId) return
    const queue = jukeboxState.queue ?? []
    if (queue.length > voteThreshold || nextOptionKeys.length > 0) return
    const playlist = playlists.find(p => p.id === jukeboxState.activePlaylistId)
    if (!playlist?.songs.length) return
    const used = [currentSong, ...queue].filter(Boolean)
    const { nextOptions: no, nextVotes: nv } = generateNextOptions(playlist, queueSize, used)
    updateDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), { nextOptions: no, nextVotes: nv }).catch(() => {})
  }, [isOwner, isPlaying, jukeboxState, roomId, voteThreshold, nextOptionKeys.length, playlists, queueSize, currentSong])

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
  }, [isOwner, isPlaying, settings?.skipThreshold, jukeboxState?.skipVoters])

  useEffect(() => {
    if (!isOwner || !authReady) return
    let alive = true
    let localPlayer = null

    function createPlayer() {
      if (!alive || !playerDivRef.current || localPlayer) return
      playerDivRef.current.innerHTML = ''
      const ytTarget = document.createElement('div')
      playerDivRef.current.appendChild(ytTarget)

      localPlayer = new window.YT.Player(ytTarget, {
        height: '202',
        width: '360',
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady() {
            if (!alive) return
            playerRef.current = localPlayer
            playerReadyRef.current = true
            const liveState = liveRef.current.jukeboxState
            const ytId = pendingRef.current ?? (liveState?.isPlaying ? liveState?.currentSong?.ytId : null)
            if (ytId) {
              localPlayer.loadVideoById(ytId)
              pendingRef.current = null
              prevSongIdRef.current = liveState?.currentSong?.id ?? null
              setYtPlayerState(3)
            }
          },
          onStateChange(e) {
            if (!alive) return
            setYtPlayerState(e.data)
            if (e.data === window.YT.PlayerState.PLAYING) {
              const dur = Math.round(localPlayer.getDuration?.() ?? 0)
              const pos = Math.round(localPlayer.getCurrentTime?.() ?? 0)
              if (liveRef.current.roomId && dur > 0) {
                const update = { syncPos: pos, syncAt: serverTimestamp() }
                if (!liveRef.current.jukeboxState?.duration) update.duration = dur
                updateDoc(doc(db, 'rooms', liveRef.current.roomId, 'state', STATE_ID), update).catch(() => {})
              }
            }
            clearInterval(loadProgressInterval.current)
            if (e.data === window.YT.PlayerState.BUFFERING) {
              setLoadProgress(Math.round((localPlayer.getVideoLoadedFraction?.() ?? 0) * 100))
              loadProgressInterval.current = setInterval(() => {
                if (!alive) return
                const pct = Math.round((localPlayer.getVideoLoadedFraction?.() ?? 0) * 100)
                setLoadProgress(pct)
                if (pct >= 100) clearInterval(loadProgressInterval.current)
              }, 500)
            } else {
              setLoadProgress(Math.round((localPlayer.getVideoLoadedFraction?.() ?? 0) * 100))
            }
            if (e.data === window.YT.PlayerState.ENDED) advanceToWinner()
          },
          onError(e) {
            if (!alive) return
            const code = e?.data
            const song = liveRef.current.jukeboxState?.currentSong
            if (![2, 5, 100, 101, 150].includes(code)) return
            const now = Date.now()
            if (song?.id && errorGuardRef.current.lastSongId === song.id && now - errorGuardRef.current.lastAt < 3000) return
            errorGuardRef.current = { lastSongId: song?.id ?? null, lastAt: now }
            if (song?.id) skippedSongIdsRef.current.add(song.id)
            advanceToWinner()
          },
        },
      })
    }

    if (window.YT?.Player) createPlayer()
    else {
      window.onYouTubeIframeAPIReady = createPlayer
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const s = document.createElement('script')
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }

    return () => {
      alive = false
      playerReadyRef.current = false
      playerRef.current = null
      clearInterval(loadProgressInterval.current)
      setYtPlayerState(-1)
      setLoadProgress(0)
      try { localPlayer?.destroy() } catch {}
    }
  }, [isOwner, authReady])

  useEffect(() => {
    if (!isOwner || !jukeboxState?.isPlaying || !jukeboxState?.currentSong) return
    const { id, ytId } = jukeboxState.currentSong
    if (prevSongIdRef.current === id) return
    prevSongIdRef.current = id
    playVideo(ytId)
  }, [isOwner, jukeboxState?.isPlaying, jukeboxState?.currentSong?.id])

  async function startJukeboxWith(pid) {
    const playlist = playlists.find(p => p.id === pid)
    if (!playlist?.songs.length || !roomId) return
    selectPlaylist(pid)
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5)
    const first = shuffled[0]
    const initialQueue = queueSize > 1 ? shuffled.slice(1, queueSize) : []

    prevSongIdRef.current = first.id
    playVideo(first.ytId)

    const { nextOptions: no, nextVotes: nv } = initialQueue.length <= 1
      ? generateNextOptions(playlist, queueSize, [first, ...initialQueue])
      : { nextOptions: {}, nextVotes: {} }

    await setDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying: true,
      activePlaylistId: pid,
      currentSong: first,
      queue: initialQueue,
      nextOptions: no,
      nextVotes: nv,
      skipVoters: {},
      syncAt: serverTimestamp(),
      syncPos: 0,
      duration: null,
      updatedAt: serverTimestamp(),
    })
  }

  async function stopJukebox() {
    if (!roomId || !jukeboxState) return
    await updateDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying: false,
      updatedAt: serverTimestamp(),
    })
    prevSongIdRef.current = null
    try { playerRef.current?.stopVideo() } catch {}
  }

  return {
    playerDivRef,
    ytPlayerState,
    loadProgress,
    remaining,
    playSongNow,
    advanceToWinner,
    startJukeboxWith,
    stopJukebox,
    playerRef,
    voteMode,
  }
}
