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
  const [playlists,  setPlaylists]  = useState([])
  const [jbState,    setJbState]    = useState(null)
  // jbState shape: { isPlaying, activePlaylistId, currentSong, candidates, roundId, voterMap }

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

  // ── YouTube player refs ────────────────────────────────────────────────────
  const playerRef      = useRef(null)
  const playerReadyRef = useRef(false)
  const pendingRef     = useRef(null)
  const playerDivRef   = useRef(null)
  const prevSongIdRef  = useRef(null)

  // Stable ref — always holds the latest state for callbacks that can't re-close
  const liveRef = useRef({})
  liveRef.current = { jbState, roomId, user, playlists }

  // ── Derived ────────────────────────────────────────────────────────────────
  const activePlaylist = playlists.find(p => p.id === activePid) ?? null
  const isPlaying  = jbState?.isPlaying  ?? false
  const currentSong = jbState?.currentSong ?? null
  const candidates  = jbState?.candidates  ?? []
  const voterMap    = jbState?.voterMap    ?? {}
  const myVote      = voterMap[user?.uid]  ?? null

  const voteCounts = Object.fromEntries(
    candidates.map(c => [c.id, Object.values(voterMap).filter(v => v === c.id).length])
  )
  const maxVotes = candidates.length ? Math.max(...Object.values(voteCounts)) : 0

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

    return () => { unsubPl(); unsubState() }
  }, [roomId])

  // ──────────────────────────────────────────────────────────────────────────
  // YouTube player (owner only)
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOwner) return

    let alive = true
    let localPlayer = null

    function createPlayer() {
      if (!alive || !playerDivRef.current) return

      localPlayer = new window.YT.Player(playerDivRef.current, {
        height: '202',
        width: '360',
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady() {
            if (!alive) { try { localPlayer.destroy() } catch {} return }
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
            }
          },
          onStateChange(e) {
            if (!alive) return
            if (e.data === window.YT.PlayerState.ENDED) advanceToWinner()
          },
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      window.onYouTubeIframeAPIReady = createPlayer
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const s    = document.createElement('script')
        s.src      = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }

    return () => {
      alive                  = false
      playerReadyRef.current = false
      playerRef.current      = null
      try { localPlayer?.destroy() } catch {}
    }
  }, [isOwner]) // eslint-disable-line react-hooks/exhaustive-deps

  // When Firestore state changes → play new song on owner's device
  useEffect(() => {
    if (!isOwner || !jbState?.isPlaying || !jbState?.currentSong) return
    const { id, ytId } = jbState.currentSong
    if (prevSongIdRef.current === id) return
    prevSongIdRef.current = id
    playVideo(ytId)
  }, [jbState?.currentSong?.id, jbState?.isPlaying, isOwner]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const { jbState, roomId, playlists } = liveRef.current
    if (!jbState || !roomId) return

    const { candidates = [], voterMap = {}, activePlaylistId } = jbState
    if (!candidates.length) return

    const counts   = Object.fromEntries(
      candidates.map(c => [c.id, Object.values(voterMap).filter(v => v === c.id).length])
    )
    const maxV     = Math.max(...Object.values(counts))
    const winners  = candidates.filter(c => counts[c.id] === maxV)
    const winner   = winners[Math.floor(Math.random() * winners.length)]

    const playlist      = playlists.find(p => p.id === activePlaylistId)
    const nextCandidates = playlist ? pickRandom(playlist.songs, 3, [winner]) : []

    await setDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying:        true,
      activePlaylistId,
      currentSong:      winner,
      candidates:       nextCandidates,
      roundId:          genId(),
      voterMap:         {},
      updatedAt:        serverTimestamp(),
    })
  }

  async function playSongNow(song) {
    if (!roomId) return
    const pid      = activePid ?? jbState?.activePlaylistId
    const playlist = playlists.find(p => p.id === pid)
    const nextCandidates = playlist ? pickRandom(playlist.songs, 3, [song]) : []
    await setDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying:        true,
      activePlaylistId: pid,
      currentSong:      song,
      candidates:       nextCandidates,
      roundId:          genId(),
      voterMap:         {},
      updatedAt:        serverTimestamp(),
    })
  }

  async function startJukeboxWith(pid) {
    const playlist = playlists.find(p => p.id === pid)
    if (!playlist?.songs.length || !roomId) return
    selectPlaylist(pid)
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5)
    const first    = shuffled[0]
    const cands    = shuffled.slice(1, 4)

    await setDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying:        true,
      activePlaylistId: pid,
      currentSong:      first,
      candidates:       cands,
      roundId:          genId(),
      voterMap:         {},
      updatedAt:        serverTimestamp(),
    })
  }

  async function stopJukebox() {
    if (!roomId || !jbState) return
    await updateDoc(doc(db, 'rooms', roomId, 'state', STATE_ID), {
      isPlaying: false,
      updatedAt: serverTimestamp(),
    })
    prevSongIdRef.current = null
    try { playerRef.current?.stopVideo() } catch {}
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Voting
  // ──────────────────────────────────────────────────────────────────────────

  async function vote(cid) {
    if (!user || !roomId || !jbState) return
    const uid = user.uid
    const ref = doc(db, 'rooms', roomId, 'state', STATE_ID)
    if (voterMap[uid] === cid) {
      await updateDoc(ref, { [`voterMap.${uid}`]: deleteField() })
    } else {
      await updateDoc(ref, { [`voterMap.${uid}`]: cid })
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
    const song = { id: genId(), url, title: title || url, ytId }
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
          {!isOwner && <span className="visitor-badge">Tryb gościa</span>}
        </div>
        <button className="btn-share" onClick={copyLink}>
          {copied ? '✓ Link skopiowany!' : '🔗 Udostępnij pokój'}
        </button>
      </header>

      <main className="main">

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="section">
            <h2 className="section-title">Playlisty</h2>

            <div className="playlist-list">
              {playlists.length === 0 && (
                <p className="empty-hint">
                  {isOwner ? 'Utwórz pierwszą playlistę poniżej' : 'Brak playlist'}
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
                  {isOwner && (
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

            {isOwner && (
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
          </div>

          {activePlaylist && (
            <div className="section songs-section">
              <h2 className="section-title">{activePlaylist.name}</h2>

              <div className="song-list">
                {activePlaylist.songs.length === 0 && (
                  <p className="empty-hint">
                    {isOwner ? 'Dodaj pierwszą piosenkę poniżej' : 'Brak piosenek'}
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
                    {isOwner && (
                      <>
                        <button className="btn-icon play" onClick={() => playSongNow(s)} title="Puść teraz">▶</button>
                        <button className="btn-icon danger" onClick={() => deleteSong(s.id)} title="Usuń">✕</button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {isOwner && (
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
            </div>
          )}

          {!activePlaylist && playlists.length > 0 && (
            <p className="empty-hint" style={{ padding: '1.5rem' }}>Wybierz playlistę z listy.</p>
          )}
        </aside>

        {/* ── Player + Voting ── */}
        <div className="player-area">

          {isOwner && (
            <div className="player-card">
              <div className="yt-wrapper">
                <div ref={playerDivRef} />
                {!isPlaying && (
                  <div className="player-overlay">
                    <span className="vinyl-icon">🎵</span>
                    <p>Wybierz playlistę i naciśnij START</p>
                  </div>
                )}
              </div>

              {isPlaying && currentSong && (
                <div className="now-playing">
                  <span className="now-label">TERAZ GRA</span>
                  <span className="now-title">{currentSong.title}</span>
                </div>
              )}

              {isPlaying && (
                <button className="btn-next" onClick={advanceToWinner} title="Pomiń do następnej">
                  ⏭ Następna piosenka
                </button>
              )}
            </div>
          )}

          {/* Voting panel */}
          {isPlaying && candidates.length > 0 && (
            <div className="voting-card">
              <h2 className="section-title voting-title">
                {isOwner ? 'Wyniki głosowania' : 'Zagłosuj na następną piosenkę'}
              </h2>
              <div className="candidates">
                {candidates.map(c => {
                  const votes     = voteCounts[c.id] ?? 0
                  const isWinning = votes > 0 && votes === maxVotes
                  const isVoted   = myVote === c.id
                  return (
                    <div
                      key={c.id}
                      className={`candidate${isWinning ? ' winning' : ''}${isVoted ? ' voted' : ''}`}
                    >
                      {isWinning && <div className="winning-badge">PROWADZI</div>}
                      <img
                        src={`https://img.youtube.com/vi/${c.ytId}/mqdefault.jpg`}
                        alt={c.title}
                        className="candidate-thumb"
                      />
                      <span className="candidate-title">{c.title}</span>
                      <div className="candidate-footer">
                        <span className="vote-count">{votes}</span>
                        {isOwner ? (
                          <button className="btn-vote" onClick={() => playSongNow(c)}>
                            ▶ Puść teraz
                          </button>
                        ) : (
                          <button
                            className={`btn-vote${isVoted ? ' active' : ''}`}
                            onClick={() => vote(c.id)}
                          >
                            {isVoted ? '✓ Zagłosowano' : '▲ Głosuj'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {isPlaying && candidates.length === 0 && (
            <div className="voting-card">
              <p className="empty-hint">Za mało piosenek na głosowanie (dodaj co najmniej 2).</p>
            </div>
          )}

          {!isPlaying && !isOwner && (
            <div className="voting-card">
              <p className="empty-hint">Właściciel pokoju jeszcze nie uruchomił jukeboxu…</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
