import { useState, useEffect, useRef } from 'react'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import {
  doc, collection,
  onSnapshot,
  setDoc, addDoc, updateDoc, deleteDoc, deleteField,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import './App.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/

function extractYtId(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()

    let ytId = null

    if (host === 'youtu.be') {
      ytId = u.pathname.split('/').filter(Boolean)[0] ?? null
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      if (u.pathname === '/watch') {
        ytId = u.searchParams.get('v')
      } else if (u.pathname.startsWith('/embed/')) {
        ytId = u.pathname.split('/')[2] ?? null
      } else if (u.pathname.startsWith('/shorts/')) {
        ytId = u.pathname.split('/')[2] ?? null
      }
    }

    return ytId && YT_ID_RE.test(ytId) ? ytId : null
  } catch {
    return null
  }
}

function pickRandom(pool, count, exclude = []) {
  const excIds = new Set(exclude.map(s => s.id))
  return [...pool.filter(s => !excIds.has(s.id))]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

function resolveWinner(candidates, voterMap, voteMode) {
  if (!candidates.length) return null
  const counts = Object.fromEntries(
    candidates.map(c => [c.id, Object.values(voterMap).filter(v => v === c.id).length])
  )
  if (voteMode === 'weighted') {
    const weights = candidates.map(c => counts[c.id] + 1)
    const total   = weights.reduce((a, b) => a + b, 0)
    let rng = Math.random() * total
    for (let i = 0; i < candidates.length; i++) {
      rng -= weights[i]
      if (rng <= 0) return candidates[i]
    }
    return candidates[candidates.length - 1]
  }
  const maxV    = Math.max(...Object.values(counts))
  const winners = candidates.filter(c => counts[c.id] === maxV)
  return winners[Math.floor(Math.random() * winners.length)]
}

// Generate 3 voting options, each being an ordered sequence of n songs.
// Stored as object { '0': [song,...], '1': [...], '2': [...] } — Firestore
// does not support arrays-of-arrays, so we use string keys.
function generateNextOptions(playlist, n, exclude = []) {
  const nextOptions = {}
  const used = [...exclude]
  for (let i = 0; i < 3; i++) {
    const songs = pickRandom(playlist?.songs ?? [], n, used)
    nextOptions[String(i)] = songs
    used.push(...songs)
  }
  return { nextOptions, nextVotes: {} }
}

// Resolve which option key wins (votes = { uid: optionKey })
function resolveOption(keys, votes, voteMode) {
  if (!keys.length) return null
  const counts = Object.fromEntries(keys.map(k => [k, 0]))
  for (const v of Object.values(votes)) {
    if (v in counts) counts[v]++
  }
  if (voteMode === 'weighted') {
    const weights = keys.map(k => counts[k] + 1)
    const total   = weights.reduce((a, b) => a + b, 0)
    let rng = Math.random() * total
    for (let i = 0; i < keys.length; i++) {
      rng -= weights[i]
      if (rng <= 0) return keys[i]
    }
    return keys[keys.length - 1]
  }
  const max     = Math.max(...keys.map(k => counts[k]))
  const winners = keys.filter(k => counts[k] === max)
  return winners[Math.floor(Math.random() * winners.length)]
}

function formatTime(sec) {
  if (sec == null) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

async function fetchYtTitle(url) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    )
    if (!res.ok) return null
    return (await res.json()).title ?? null
  } catch { return null }
}

const STATE_ID = 'main'

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {

  // ── Auth / room ────────────────────────────────────────────────────────────
  const [user,       setUser]       = useState(null)
  const [roomId,     setRoomId]     = useState(null)
  const [isOwner,    setIsOwner]    = useState(false)
  const [authReady,  setAuthReady]  = useState(false)

  // ── Firestore data ─────────────────────────────────────────────────────────
  const [playlists,     setPlaylists]     = useState([])
  const [jbState,       setJbState]       = useState(null)
  const [roomSettings,  setRoomSettings]  = useState({})

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activePid,      setActivePid]      = useState(() =>
    new URLSearchParams(window.location.search).get('playlist')
  )   // selected playlist in sidebar
  const [newPlaylist,    setNewPlaylist]     = useState('')
  const [newUrl,         setNewUrl]          = useState('')
  const [newTitle,       setNewTitle]        = useState('')
  const [urlErr,         setUrlErr]          = useState('')
  const [fetchingTitle,  setFetchingTitle]   = useState(false)
  const [editingId,      setEditingId]       = useState(null)
  const [editingName,    setEditingName]     = useState('')
  const [copied,         setCopied]          = useState(false)
  const [joinUrl,        setJoinUrl]         = useState('')
  const [ytPlayerState,  setYtPlayerState]   = useState(-1) // -1=uninit,1=playing,2=paused,3=buffering,5=cued
  const [loadProgress,   setLoadProgress]    = useState(0)
  const [remaining,      setRemaining]       = useState(null)
  const [viewAsGuest,    setViewAsGuest]     = useState(false)
  const [sidebarOpen,    setSidebarOpen]     = useState(true)
  const [collapsed,      setCollapsed]       = useState({})

  function toggleSection(key) {
    setCollapsed(c => ({ ...c, [key]: !c[key] }))
  }

  // ── YouTube player refs ────────────────────────────────────────────────────
  const playerRef      = useRef(null)
  const playerReadyRef = useRef(false)
  const pendingRef     = useRef(null)
  const playerDivRef   = useRef(null)
  const prevSongIdRef  = useRef(null)
  const errorGuardRef  = useRef({ lastSongId: null, lastAt: 0 })
  const skippedSongIdsRef   = useRef(new Set())
  const loadProgressInterval  = useRef(null)
  const skipAdvancePendingRef = useRef(false)

  // Stable ref — always holds the latest state for callbacks that can't re-close
  const liveRef = useRef({})

  // ── Derived ────────────────────────────────────────────────────────────────
  const activePlaylist = playlists.find(p => p.id === activePid) ?? null
  const isPlaying   = jbState?.isPlaying  ?? false
  const currentSong = jbState?.currentSong ?? null

  const queueSize      = Math.max(1, roomSettings?.queueSize      ?? 1)
  const voteMode       = roomSettings?.voteMode       ?? 'highest'
  const skipThreshold  = roomSettings?.skipThreshold  ?? 0
  const voteThreshold  = roomSettings?.voteThreshold  ?? 1

  // Single-vote options (object, NOT array — Firestore forbids nested arrays)
  const nextOptions    = jbState?.nextOptions ?? {}   // { '0': [song,...], '1': [...], '2': [...] }
  const nextVotesData  = jbState?.nextVotes   ?? {}   // { uid: optionKey }
  const nextOptionKeys = Object.keys(nextOptions).sort()

  const skipVoters = jbState?.skipVoters ?? {}
  const skipCount  = Object.keys(skipVoters).length
  const mySkipVote = skipVoters[user?.uid] ?? false

  // Owner can preview the guest view — all logic still uses isOwner, only rendering uses this
  const showOwnerUI = isOwner && !viewAsGuest

  useEffect(() => {
    liveRef.current = { jbState, roomId, user, playlists, roomSettings }
  }, [jbState, roomId, user, playlists, roomSettings])

  useEffect(() => {
    if (!isPlaying || !jbState?.syncAt || !jbState?.duration) {
      setRemaining(null)
      return
    }
    function tick() {
      const elapsed = (Date.now() - jbState.syncAt.toMillis()) / 1000
      setRemaining(Math.max(0, jbState.duration - (jbState.syncPos ?? 0) - elapsed))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [isPlaying, jbState?.syncAt, jbState?.syncPos, jbState?.duration])

  // Auto-generate nextOptions when queue ≤ voteThreshold and no options exist yet
  useEffect(() => {
    if (!isOwner || !isPlaying || !jbState || !roomId) return
    const queue = jbState.queue ?? []
    if (queue.length > voteThreshold) return    // still enough songs, no voting needed
    if (nextOptionKeys.length > 0) return        // options already exist
    const { activePlaylistId } = jbState
    const playlist = playlists.find(p => p.id === activePlaylistId)
    if (!playlist?.songs.length) return
    const used = [currentSong, ...queue].filter(Boolean)
    const { nextOptions: no, nextVotes: nv } = generateNextOptions(playlist, queueSize, used)
    updateDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), { nextOptions: no, nextVotes: nv }).catch(() => {})
  }, [isPlaying, isOwner, nextOptionKeys.length, (jbState?.queue ?? []).length, queueSize, voteThreshold, roomId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance when skip vote threshold is reached (owner only)
  useEffect(() => {
    if (!isOwner || !isPlaying) return
    const threshold = roomSettings?.skipThreshold ?? 0
    if (threshold <= 0) return
    const count = Object.keys(jbState?.skipVoters ?? {}).length
    if (count >= threshold && !skipAdvancePendingRef.current) {
      skipAdvancePendingRef.current = true
      advanceToWinner().finally(() => { skipAdvancePendingRef.current = false })
    }
  }, [jbState?.skipVoters]) // eslint-disable-line react-hooks/exhaustive-deps

  // ──────────────────────────────────────────────────────────────────────────
  // Playback helpers
  // ──────────────────────────────────────────────────────────────────────────

  function playVideo(ytId) {
    if (playerReadyRef.current && playerRef.current) {
      playerRef.current.loadVideoById(ytId)
    } else {
      pendingRef.current = ytId
    }
  }

  // Called by YouTube onStateChange → reads live state via ref (no stale closure)
  async function advanceToWinner() {
    const { jbState, roomId, playlists, roomSettings } = liveRef.current
    if (!jbState || !roomId) return

    const { activePlaylistId } = jbState
    const voteMode  = roomSettings?.voteMode  ?? 'highest'
    const skippedIds  = skippedSongIdsRef.current

    // If songs remain in queue, just advance (keep existing options)
    const queue = jbState.queue ?? []
    const validQueue = queue.filter(s => !skippedIds.has(s.id))

    if (validQueue.length > 0) {
      const nextSong = validQueue[0]
      const newQueue = validQueue.slice(1)
      prevSongIdRef.current = nextSong.id
      playVideo(nextSong.ytId)
      await setDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
        isPlaying: true, activePlaylistId, currentSong: nextSong,
        queue: newQueue,
        nextOptions: jbState.nextOptions ?? {},
        nextVotes: jbState.nextVotes ?? {},
        skipVoters: {},
        syncAt: serverTimestamp(), syncPos: 0, duration: null, updatedAt: serverTimestamp(),
      })
      return
    }

    // Queue exhausted → pick winning option, queue its songs
    const options = jbState.nextOptions ?? {}
    const votes   = jbState.nextVotes   ?? {}
    const keys    = Object.keys(options).sort()
    if (!keys.length) return

    const winKey   = resolveOption(keys, votes, voteMode)
    const winSongs = (options[winKey] ?? []).filter(s => !skippedIds.has(s.id))
    if (!winSongs.length) return

    const [first, ...rest] = winSongs
    prevSongIdRef.current = first.id
    playVideo(first.ytId)

    // Clear options — auto-effect will generate new ones when queue drops to ≤ 1
    const usedSongs = [...winSongs, ...[...skippedIds].map(id => ({ id }))]
    await setDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying: true, activePlaylistId, currentSong: first,
      queue: rest,
      nextOptions: {},
      nextVotes: {},
      skipVoters: {},
      syncAt: serverTimestamp(), syncPos: 0, duration: null, updatedAt: serverTimestamp(),
    })
  }

  async function playSongNow(song) {
    if (!roomId) return
    const pid      = activePid ?? jbState?.activePlaylistId
    const playlist = playlists.find(p => p.id === pid)

    prevSongIdRef.current = song.id
    playVideo(song.ytId)

    // Queue empty → generate options immediately so voting is ready
    const { nextOptions: no, nextVotes: nv } = generateNextOptions(playlist, queueSize, [song])
    await setDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying: true, activePlaylistId: pid, currentSong: song,
      queue: [],
      nextOptions: no, nextVotes: nv,
      skipVoters: {},
      syncAt: serverTimestamp(), syncPos: 0, duration: null, updatedAt: serverTimestamp(),
    })
  }

  async function skipBrokenSongAndAdvance(song) {
    if (song?.id) skippedSongIdsRef.current.add(song.id)
    await advanceToWinner()
  }


  // ──────────────────────────────────────────────────────────────────────────
  // Auth + room setup
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const roomParam = new URLSearchParams(window.location.search).get('room')

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        await signInAnonymously(auth)
        return
      }

      setUser(u)

      const rid    = roomParam || u.uid
      const owner  = !roomParam || roomParam === u.uid

      setRoomId(rid)
      setIsOwner(owner)

      if (owner) {
        // Put roomId in URL so user can share it
        const url = new URL(window.location.href)
        if (!url.searchParams.get('room')) {
          url.searchParams.set('room', u.uid)
          window.history.replaceState({}, '', url.toString())
        }
        // Ensure room document exists
        await setDoc(doc(db, 'rooms', u.uid), { ownerId: u.uid }, { merge: true })
      }

      setAuthReady(true)
    })

    return () => unsub()
  }, [])

  // ──────────────────────────────────────────────────────────────────────────
  // Firestore listeners
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId) return

    const unsubPl = onSnapshot(
      collection(db, 'rooms', roomId, 'playlists'),
      snap => {
        const pls = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0))
        setPlaylists(pls)
        setActivePid(id => id ?? (pls[0]?.id ?? null))
      }
    )

    const unsubState = onSnapshot(
      doc(db, 'rooms', roomId, 'state', STATE_ID),
      snap => setJbState(snap.exists() ? snap.data() : null)
    )

    const unsubRoom = onSnapshot(
      doc(db, 'rooms', roomId),
      snap => snap.exists() && setRoomSettings(snap.data().settings ?? {})
    )

    return () => { unsubPl(); unsubState(); unsubRoom() }
  }, [roomId])

  // ──────────────────────────────────────────────────────────────────────────
  // YouTube player (owner only)
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOwner || !authReady) return

    let alive = true
    let localPlayer = null

    function createPlayer() {
      if (!alive || !playerDivRef.current || localPlayer) return

      // Inject a fresh inner div — YT replaces it with an iframe.
      // The React-managed outer div stays in the DOM across destroy/recreate cycles.
      playerDivRef.current.innerHTML = ''
      const ytTarget = document.createElement('div')
      playerDivRef.current.appendChild(ytTarget)

      localPlayer = new window.YT.Player(ytTarget, {
        height: '202',
        width: '360',
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady() {
            if (!alive) { try { localPlayer.destroy() } catch (err) { console.warn('Player destroy failed', err) } return }
            playerRef.current      = localPlayer
            playerReadyRef.current = true
            // load pending OR fall back to whatever Firestore says is playing
            const liveState = liveRef.current.jbState
            const ytId = pendingRef.current
              ?? (liveState?.isPlaying ? liveState?.currentSong?.ytId : null)
            if (ytId) {
              localPlayer.loadVideoById(ytId)
              pendingRef.current = null
              prevSongIdRef.current = liveState?.currentSong?.id ?? null
              setYtPlayerState(3) // buffering — will update via onStateChange
            }
          },
          onStateChange(e) {
            if (!alive) return
            setYtPlayerState(e.data)
            if (e.data === window.YT.PlayerState.PLAYING) {
              const dur = Math.round(localPlayer.getDuration?.() ?? 0)
              const pos = Math.round(localPlayer.getCurrentTime?.() ?? 0)
              const { roomId: rid, jbState: ljs } = liveRef.current
              if (rid && dur > 0) {
                const update = { syncPos: pos, syncAt: serverTimestamp() }
                if (!ljs?.duration) update.duration = dur
                updateDoc(doc(db, 'rooms', rid, 'state', STATE_ID), update).catch(() => {})
              }
            }
            // Track buffer progress while loading
            clearInterval(loadProgressInterval.current)
            if (e.data === window.YT.PlayerState.BUFFERING) {
              setLoadProgress(Math.round((localPlayer.getVideoLoadedFraction?.() ?? 0) * 100))
              loadProgressInterval.current = setInterval(() => {
                if (!alive) { clearInterval(loadProgressInterval.current); return }
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
            const { currentSong } = liveRef.current.jbState ?? {}
            console.warn('[YT:onError] playback failure', {
              code,
              songId: currentSong?.id ?? null,
              ytId: currentSong?.ytId ?? null,
            })

            if (![2, 5, 100, 101, 150].includes(code)) return

            const now = Date.now()
            if (
              currentSong?.id &&
              errorGuardRef.current.lastSongId === currentSong.id &&
              now - errorGuardRef.current.lastAt < 3000
            ) {
              console.warn('[YT:onError] loop guard active, ignoring duplicate error', {
                songId: currentSong.id,
                code,
              })
              return
            }

            errorGuardRef.current = {
              lastSongId: currentSong?.id ?? null,
              lastAt: now,
            }

            skipBrokenSongAndAdvance(currentSong)
          },
        },
      })
    }

    if (window.YT?.Player) {
      // Fast path: API already ready (cached / index.html script beat us here)
      createPlayer()
    } else {
      // Slow path: set callback and ensure the script is in the document
      window.onYouTubeIframeAPIReady = createPlayer
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const s = document.createElement('script')
        s.src   = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }

    return () => {
      alive                  = false
      playerReadyRef.current = false
      playerRef.current      = null
      clearInterval(loadProgressInterval.current)
      setYtPlayerState(-1)
      setLoadProgress(0)
      try { localPlayer?.destroy() } catch (err) { console.warn('Player cleanup failed', err) }
    }
  }, [isOwner, authReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // When Firestore state changes → play new song on owner's device
  useEffect(() => {
    if (!isOwner || !jbState?.isPlaying || !jbState?.currentSong) return
    const { id, ytId } = jbState.currentSong
    if (prevSongIdRef.current === id) return
    prevSongIdRef.current = id
    playVideo(ytId)
  }, [jbState?.currentSong?.id, jbState?.isPlaying, isOwner]) // eslint-disable-line react-hooks/exhaustive-deps

  async function startJukeboxWith(pid) {
    const playlist = playlists.find(p => p.id === pid)
    if (!playlist?.songs.length || !roomId) return
    selectPlaylist(pid)
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5)
    const first    = shuffled[0]
    // Pre-queue queueSize-1 additional songs for the first batch
    const initialQueue = queueSize > 1 ? shuffled.slice(1, queueSize) : []

    prevSongIdRef.current = first.id
    playVideo(first.ytId)

    const batchSongs = [first, ...initialQueue]
    // Pre-generate options if queue is short enough to show voting immediately
    const genOpts = initialQueue.length <= 1
    const { nextOptions: nc, nextVotes: nv } = genOpts
      ? generateNextOptions(playlist, queueSize, batchSongs)
      : { nextOptions: {}, nextVotes: {} }

    await setDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying: true, activePlaylistId: pid, currentSong: first,
      queue: initialQueue,
      nextOptions: nc, nextVotes: nv,
      skipVoters: {},
      syncAt: serverTimestamp(), syncPos: 0, duration: null, updatedAt: serverTimestamp(),
    })
  }

  async function saveSettings(key, value) {
    if (!roomId || !isOwner) return
    await updateDoc(doc(db, 'rooms', roomId), { [`settings.${key}`]: value })
  }

  async function stopJukebox() {
    if (!roomId || !jbState) return
    await updateDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying: false,
      updatedAt: serverTimestamp(),
    })
    prevSongIdRef.current = null
    try { playerRef.current?.stopVideo() } catch (err) { console.warn('Player stop failed', err) }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Voting
  // ──────────────────────────────────────────────────────────────────────────

  async function vote(optionKey) {
    if (!user || !roomId || !jbState) return
    const uid = user.uid
    const ref = doc(db, 'rooms', roomId, 'state', STATE_ID)
    const currentVote = (jbState.nextVotes ?? {})[uid]
    if (currentVote === optionKey) {
      await updateDoc(ref, { [`nextVotes.${uid}`]: deleteField() })
    } else {
      await updateDoc(ref, { [`nextVotes.${uid}`]: optionKey })
    }
  }

  async function voteSkip() {
    if (!user || !roomId || !isPlaying) return
    const uid = user.uid
    const ref = doc(db, 'rooms', roomId, 'state', STATE_ID)
    if (skipVoters[uid]) {
      await updateDoc(ref, { [`skipVoters.${uid}`]: deleteField() })
    } else {
      await updateDoc(ref, { [`skipVoters.${uid}`]: true })
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Playlist CRUD (owner only)
  // ──────────────────────────────────────────────────────────────────────────

  async function addPlaylist() {
    const name = newPlaylist.trim()
    if (!name || !roomId) return
    const ref = await addDoc(collection(db, 'rooms', roomId, 'playlists'), {
      name, songs: [], createdAt: serverTimestamp(),
    })
    setActivePid(ref.id)
    setNewPlaylist('')
  }

  async function deletePlaylist(id) {
    if (!roomId) return
    await deleteDoc(doc(db, 'rooms', roomId, 'playlists', id))
    if (activePid === id) setActivePid(null)
  }

  async function saveEditPlaylist() {
    const name = editingName.trim()
    if (name && editingId && roomId)
      await updateDoc(doc(db, 'rooms', roomId, 'playlists', editingId), { name })
    setEditingId(null)
    setEditingName('')
  }

  async function handleUrlBlur() {
    const url = newUrl.trim()
    if (!url || newTitle.trim()) return
    const ytId = extractYtId(url)
    if (!ytId) {
      setUrlErr('Nieprawidłowy link YouTube')
      return
    }
    setUrlErr('')
    setFetchingTitle(true)
    const title = await fetchYtTitle(url)
    if (title) setNewTitle(title)
    setFetchingTitle(false)
  }

  async function addSong() {
    const url   = newUrl.trim()
    const title = newTitle.trim()
    if (!url || !activePid || !roomId) return
    const ytId = extractYtId(url)
    if (!ytId) { setUrlErr('Nieprawidłowy link YouTube'); return }
    const cleanUrl = `https://youtu.be/${ytId}`
    const song = { id: genId(), url: cleanUrl, title: title || cleanUrl, ytId }
    await updateDoc(doc(db, 'rooms', roomId, 'playlists', activePid), {
      songs: [...(activePlaylist?.songs ?? []), song],
    })
    setNewUrl('')
    setNewTitle('')
    setUrlErr('')
  }

  async function deleteSong(sid) {
    if (!activePlaylist || !roomId) return
    await updateDoc(doc(db, 'rooms', roomId, 'playlists', activePid), {
      songs: activePlaylist.songs.filter(s => s.id !== sid),
    })
  }

  function selectPlaylist(pid) {
    setActivePid(pid)
    const url = new URL(window.location.href)
    if (pid) url.searchParams.set('playlist', pid)
    else url.searchParams.delete('playlist')
    window.history.replaceState({}, '', url.toString())
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleJoinRoom() {
    const input = joinUrl.trim()
    if (!input) return
    let roomId = input
    try {
      const u = new URL(input)
      const r = u.searchParams.get('room')
      if (r) roomId = r
    } catch {
      // not a full URL — treat as bare room ID
    }
    const dest = new URL(window.location.origin + window.location.pathname)
    dest.searchParams.set('room', roomId)
    window.location.href = dest.toString()
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  if (!authReady) {
    return (
      <div className="splash">
        <div className="splash-icon">🎵</div>
        <p>Łączenie...</p>
      </div>
    )
  }

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <span className="header-icon">🎵</span>
          <h1>JUKEBOX</h1>
          {!showOwnerUI && <span className="visitor-badge">{isOwner ? 'Podgląd gościa' : 'Tryb gościa'}</span>}
        </div>
        <div className="header-actions">
          {showOwnerUI && (
            <button className="btn-view-toggle" onClick={() => setSidebarOpen(v => !v)} title={sidebarOpen ? 'Ukryj panel' : 'Pokaż panel'}>
              {sidebarOpen ? '◀ Panel' : '▶ Panel'}
            </button>
          )}
          {isOwner && (
            <button className="btn-view-toggle" onClick={() => setViewAsGuest(v => !v)}>
              {viewAsGuest ? '⚙ Widok admina' : '👁 Widok gościa'}
            </button>
          )}
          <button className="btn-share" onClick={copyLink}>
            {copied ? '✓ Link skopiowany!' : '🔗 Udostępnij pokój'}
          </button>
        </div>
      </header>

      <main className="main">

        {/* ── Sidebar ── */}
        <aside className={`sidebar${sidebarOpen ? '' : ' sidebar-hidden'}`}>

          {/* ── Ustawienia (admin) ── */}
          {showOwnerUI && (
            <div className="section">
              <div className="section-title-row">
                <h2 className="section-title">Ustawienia pokoju</h2>
                <button className="btn-collapse" onClick={() => toggleSection('settings')}>
                  {collapsed.settings ? '▶' : '▼'}
                </button>
              </div>
              {!collapsed.settings && <>
              <div className="setting-row">
                <span className="setting-label">Głosowanie</span>
                <div className="setting-toggle-group">
                  <button
                    className={`btn-setting${voteMode === 'highest' ? ' active' : ''}`}
                    onClick={() => saveSettings('voteMode', 'highest')}
                  >Najwyższy wynik</button>
                  <button
                    className={`btn-setting${voteMode === 'weighted' ? ' active' : ''}`}
                    onClick={() => saveSettings('voteMode', 'weighted')}
                  >Ważone losowanie</button>
                </div>
              </div>
              <div className="setting-row">
                <span className="setting-label">Utworów w grupie</span>
                <div className="note-picker">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      className={`note-btn${n <= queueSize ? ' active' : ''}`}
                      onClick={() => saveSettings('queueSize', n === queueSize && n > 1 ? n - 1 : n)}
                      title={`${n}`}
                    >♪</button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <span className="setting-label">Głosuj, gdy zostało ≤</span>
                <div className="note-picker">
                  {[1,2,3].map(n => (
                    <button
                      key={n}
                      className={`note-btn${n <= voteThreshold ? ' active' : ''}`}
                      onClick={() => saveSettings('voteThreshold', n === voteThreshold ? n - 1 : n)}
                      title={`${n}`}
                    >♪</button>
                  ))}
                </div>
              </div>
              <div className="setting-row">
                <span className="setting-label">Pomiń po głosach</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    className="skip-threshold-input"
                    value={skipThreshold || ''}
                    placeholder="0"
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      saveSettings('skipThreshold', isNaN(v) || v < 0 ? 0 : v)
                    }}
                  />
                  <span className="setting-hint">
                    {skipThreshold > 0 ? `${skipThreshold} głos${skipThreshold === 1 ? '' : skipThreshold < 5 ? 'y' : 'ów'}` : 'wyłączone'}
                  </span>
                </div>
              </div>
              </>}
            </div>
          )}

          {/* ── Link do pokoju / wejdź ── */}
          <div className="section">
            <div className="section-title-row">
              <h2 className="section-title">{showOwnerUI ? 'Link do pokoju' : 'Wejdź do pokoju'}</h2>
              <button className="btn-collapse" onClick={() => toggleSection('link')}>
                {collapsed.link ? '▶' : '▼'}
              </button>
            </div>
            {!collapsed.link && <>
            {showOwnerUI && (
              <div className="room-link-row">
                <input
                  readOnly
                  className="room-link-input"
                  value={window.location.href}
                  onClick={e => e.target.select()}
                  title="Kliknij aby zaznaczyć"
                />
                <button className="btn-icon" onClick={copyLink} title="Kopiuj link">
                  {copied ? '✓' : '🔗'}
                </button>
              </div>
            )}
            <div className="add-row" style={showOwnerUI ? { marginTop: '0.5rem' } : undefined}>
              <input
                value={joinUrl}
                onChange={e => setJoinUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
                placeholder="Wklej link do pokoju…"
              />
              <button className="btn-accent" onClick={handleJoinRoom} title="Przejdź do pokoju">→</button>
            </div>
            </>}
          </div>

          <div className="section">
            <div className="section-title-row">
              <h2 className="section-title">Playlisty</h2>
              <button className="btn-collapse" onClick={() => toggleSection('playlists')}>
                {collapsed.playlists ? '▶' : '▼'}
              </button>
            </div>
            {!collapsed.playlists && <>

            <div className="playlist-list">
              {playlists.length === 0 && (
                <p className="empty-hint">
                  {showOwnerUI ? 'Utwórz pierwszą playlistę poniżej' : 'Brak playlist'}
                </p>
              )}
              {playlists.map(pl => {
                const isActivePl  = pl.id === activePid
                const isPlayingPl = pl.id === jbState?.activePlaylistId && isPlaying
                return (
                <div key={pl.id} className={`playlist-item${isActivePl ? ' active' : ''}${isPlayingPl ? ' playing' : ''}`}>
                  {editingId === pl.id ? (
                    <input
                      className="edit-input"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  saveEditPlaylist()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      onBlur={saveEditPlaylist}
                      autoFocus
                    />
                  ) : (
                    <button className="playlist-name-btn" onClick={() => selectPlaylist(pl.id)}>
                      {isPlayingPl && <span className="playing-dot" title="Gra teraz">♪</span>}
                      {pl.name}
                      <span className="count">{pl.songs.length}</span>
                    </button>
                  )}
                  {showOwnerUI && (
                    <div className="playlist-actions">
                      <button
                        className="btn-icon play"
                        onClick={() => startJukeboxWith(pl.id)}
                        disabled={pl.songs.length === 0}
                        title="Uruchom tę playlistę"
                      >▶</button>
                      <button className="btn-icon" onClick={() => { setEditingId(pl.id); setEditingName(pl.name) }} title="Zmień nazwę">✎</button>
                      <button className="btn-icon danger" onClick={() => deletePlaylist(pl.id)} title="Usuń">✕</button>
                    </div>
                  )}
                </div>
                )
              })}
            </div>

            {showOwnerUI && (
              <div className="add-row">
                <input
                  value={newPlaylist}
                  onChange={e => setNewPlaylist(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPlaylist()}
                  placeholder="Nazwa nowej playlisty..."
                />
                <button className="btn-accent" onClick={addPlaylist} title="Dodaj">+</button>
              </div>
            )}
            </>}
          </div>

          {activePlaylist && (
            <div className="section songs-section">
              <div className="section-title-row">
                <h2 className="section-title">{activePlaylist.name}</h2>
                <button className="btn-collapse" onClick={() => toggleSection('songs')}>
                  {collapsed.songs ? '▶' : '▼'}
                </button>
              </div>
              {!collapsed.songs && <>

              <div className="song-list">
                {activePlaylist.songs.length === 0 && (
                  <p className="empty-hint">
                    {showOwnerUI ? 'Dodaj pierwszą piosenkę poniżej' : 'Brak piosenek'}
                  </p>
                )}
                {activePlaylist.songs.map(s => (
                  <div key={s.id} className={`song-item${currentSong?.id === s.id && isPlaying ? ' song-playing' : ''}`}>
                    <img
                      src={`https://img.youtube.com/vi/${s.ytId}/default.jpg`}
                      alt=""
                      className="song-thumb"
                    />
                    <span className="song-title">{s.title}</span>
                    {showOwnerUI && (
                      <>
                        <button className="btn-icon play" onClick={() => playSongNow(s)} title="Puść teraz">▶</button>
                        <button className="btn-icon danger" onClick={() => deleteSong(s.id)} title="Usuń">✕</button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {showOwnerUI && (
                <>
                  <div className="add-song-form">
                    <input
                      value={newUrl}
                      onChange={e => { setNewUrl(e.target.value); setUrlErr('') }}
                      onBlur={handleUrlBlur}
                      onKeyDown={e => e.key === 'Enter' && addSong()}
                      placeholder="Link YouTube..."
                      className={urlErr ? 'input-error' : ''}
                    />
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSong()}
                      placeholder={fetchingTitle ? 'Pobieranie tytułu…' : 'Tytuł (pobierany auto)'}
                      disabled={fetchingTitle}
                    />
                    {urlErr && <p className="error-msg">{urlErr}</p>}
                    <button className="btn-primary" onClick={addSong}>+ Dodaj piosenkę</button>
                  </div>

                  <div className="play-controls">
                    {!isPlaying ? (
                      <button
                        className="btn-start"
                        onClick={() => startJukeboxWith(activePid)}
                        disabled={activePlaylist.songs.length === 0}
                      >
                        ▶ START
                      </button>
                    ) : (
                      <button className="btn-stop" onClick={stopJukebox}>■ STOP</button>
                    )}
                  </div>
                </>
              )}
              </>}
            </div>
          )}

          {!activePlaylist && playlists.length > 0 && (
            <p className="empty-hint" style={{ padding: '1.5rem' }}>Wybierz playlistę z listy.</p>
          )}
        </aside>

        {/* ── Player + Voting ── */}
        <div className={`player-area${showOwnerUI ? ' player-area-admin' : ''}`}>

          {showOwnerUI ? (
            <>
              {/* ── Admin: lewa kolumna — zakolejkowane ── */}
              <div className="admin-col">
                {isPlaying ? (
                  <div className="voting-card">
                    <h2 className="section-title voting-title">Zaraz zagra</h2>
                    {(jbState?.queue ?? []).length > 0 ? (
                      <ol className="queue-list">
                        {jbState.queue.map((song, i) => (
                          <li key={song.id} className="queue-item">
                            <span className="queue-pos">{i + 1}</span>
                            <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-thumb" />
                            <span className="queue-title">{song.title}</span>
                            <button className="btn-icon play" onClick={() => playSongNow(song)} title="Puść teraz">▶</button>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="empty-hint">Kolejka pusta</p>
                    )}
                  </div>
                ) : null}
              </div>

              {/* ── Admin: środkowa kolumna — odtwarzacz ── */}
              <div className="admin-col admin-col-center">
                <div className="player-card">
                  <div className="yt-wrapper">
                    <div ref={playerDivRef} />
                    <div className="yt-click-blocker" />
                    {!isPlaying && (
                      <div className="player-overlay">
                        <span className="vinyl-icon">🎵</span>
                        <p>Wybierz playlistę i naciśnij START</p>
                      </div>
                    )}
                  </div>
                  {isPlaying && currentSong && (
                    <div className="now-playing">
                      <span className="now-label">
                        TERAZ GRA
                        {ytPlayerState === 3 && loadProgress < 100 && <span className="load-pct"> · {loadProgress}%</span>}
                      </span>
                      <span className="now-title">{currentSong.title}</span>
                      {remaining != null && <span className="now-timer">{formatTime(remaining)}</span>}
                    </div>
                  )}
                  {isPlaying && (
                    <div className="player-controls">
                      <button
                        className="btn-playpause"
                        onClick={() => ytPlayerState === 1 ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo()}
                        title={ytPlayerState === 1 ? 'Pauza' : 'Odtwórz'}
                      >
                        {ytPlayerState === 1 ? '⏸' : '▶'}
                      </button>
                      <button className="btn-next" onClick={advanceToWinner} title="Następna piosenka">⏭ Następna</button>
                    </div>
                  )}
                </div>
                {isPlaying && skipThreshold > 0 && (
                  <div className="skip-card">
                    <span className="skip-count">{skipCount}/{skipThreshold} głosów na pominięcie</span>
                  </div>
                )}
              </div>

              {/* ── Admin: prawa kolumna — głosowanie ── */}
              <div className="admin-col">
                {isPlaying && (jbState?.queue ?? []).length <= voteThreshold && nextOptionKeys.length > 0 && (
                  <div className="voting-card">
                    <h2 className="section-title voting-title">Zagłosuj na następne piosenki</h2>
                    <div className="options-list">
                      {nextOptionKeys.map(key => {
                        const songs       = nextOptions[key] ?? []
                        const myVote      = nextVotesData[user?.uid] ?? null
                        const isVoted     = myVote === key
                        const voteCount   = Object.values(nextVotesData).filter(v => v === key).length
                        const maxOptVotes = Math.max(0, ...nextOptionKeys.map(k =>
                          Object.values(nextVotesData).filter(v => v === k).length
                        ))
                        const isWinning   = voteCount > 0 && voteCount === maxOptVotes
                        return (
                          <div key={key} className={`vote-option${isVoted ? ' voted' : ''}${isWinning ? ' winning' : ''}`}>
                            <div className="vote-option-header">
                              <span className="vote-option-label">Opcja {parseInt(key) + 1}</span>
                              {voteCount > 0 && (
                                <span className="vote-option-count">
                                  {voteCount} głos{voteCount === 1 ? '' : voteCount < 5 ? 'y' : 'ów'}
                                </span>
                              )}
                            </div>
                            <div className="option-songs">
                              {songs.map((s, i) => (
                                <div key={s.id} className="option-song-item">
                                  <span className="option-song-pos">{i + 1}</span>
                                  <img src={`https://img.youtube.com/vi/${s.ytId}/default.jpg`} alt="" className="slot-thumb" />
                                  <span className="slot-title">{s.title}</span>
                                  <button className="btn-icon play" onClick={() => playSongNow(s)} title="Puść teraz">▶</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {isPlaying && (jbState?.queue ?? []).length <= voteThreshold && nextOptionKeys.length === 0 && (
                  <div className="voting-card">
                    <p className="empty-hint">Za mało piosenek na głosowanie (dodaj więcej do playlisty).</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* YT player ukryty poza ekranem gdy owner w widoku gościa */}
              {isOwner && (
                <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
                  <div ref={playerDivRef} />
                </div>
              )}

              {/* Now playing — guest view */}
              {isPlaying && currentSong && (
                <div className="now-playing-guest">
                  <span className="now-label">Teraz gra</span>
                  <span className="now-title">{currentSong.title}</span>
                  {remaining != null && <span className="now-timer">{formatTime(remaining)}</span>}
                </div>
              )}

              {/* Queue — guest */}
              {isPlaying && (jbState?.queue ?? []).length > 0 && (
                <div className="voting-card">
                  <h2 className="section-title voting-title">Zaraz zagra</h2>
                  <ol className="queue-list">
                    {jbState.queue.map((song, i) => (
                      <li key={song.id} className="queue-item">
                        <span className="queue-pos">{i + 1}</span>
                        <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-thumb" />
                        <span className="queue-title">{song.title}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Voting — guest */}
              {isPlaying && (jbState?.queue ?? []).length <= voteThreshold && nextOptionKeys.length > 0 && (
                <div className="voting-card">
                  <h2 className="section-title voting-title">Zagłosuj na następne piosenki</h2>
                  <div className="options-list">
                    {nextOptionKeys.map(key => {
                      const songs       = nextOptions[key] ?? []
                      const myVote      = nextVotesData[user?.uid] ?? null
                      const isVoted     = myVote === key
                      const voteCount   = Object.values(nextVotesData).filter(v => v === key).length
                      const maxOptVotes = Math.max(0, ...nextOptionKeys.map(k =>
                        Object.values(nextVotesData).filter(v => v === k).length
                      ))
                      const isWinning   = voteCount > 0 && voteCount === maxOptVotes
                      return (
                        <div key={key} className={`vote-option${isVoted ? ' voted' : ''}${isWinning ? ' winning' : ''}`}>
                          <div className="vote-option-header">
                            <span className="vote-option-label">Opcja {parseInt(key) + 1}</span>
                            {voteCount > 0 && (
                              <span className="vote-option-count">
                                {voteCount} głos{voteCount === 1 ? '' : voteCount < 5 ? 'y' : 'ów'}
                              </span>
                            )}
                            <button
                              className={`btn-vote-option${isVoted ? ' active' : ''}`}
                              onClick={() => vote(key)}
                            >
                              {isVoted ? '✓ Zagłosowano' : '▲ Głosuj'}
                            </button>
                          </div>
                          <div className="option-songs">
                            {songs.map((s, i) => (
                              <div key={s.id} className="option-song-item">
                                <span className="option-song-pos">{i + 1}</span>
                                <img src={`https://img.youtube.com/vi/${s.ytId}/default.jpg`} alt="" className="slot-thumb" />
                                <span className="slot-title">{s.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Skip — guest */}
              {isPlaying && skipThreshold > 0 && (
                <div className="skip-card">
                  <button className={`btn-skip${mySkipVote ? ' active' : ''}`} onClick={voteSkip}>
                    {mySkipVote ? '✓ Chcę pominąć' : '⏭ Pomiń piosenkę'}
                  </button>
                  <span className="skip-count">{skipCount}/{skipThreshold}</span>
                </div>
              )}

              {isPlaying && (jbState?.queue ?? []).length <= voteThreshold && nextOptionKeys.length === 0 && (
                <div className="voting-card">
                  <p className="empty-hint">Za mało piosenek na głosowanie (dodaj więcej do playlisty).</p>
                </div>
              )}

              {!isPlaying && (
                <div className="voting-card">
                  <p className="empty-hint">Właściciel pokoju jeszcze nie uruchomił jukeboxu…</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
