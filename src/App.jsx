import { useState, useEffect, useRef } from 'react'
import './App.css'

// ─── Utilities ───────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

function extractYtId(url) {
  const m = url.match(/(?:[?&]v=|youtu\.be\/|\/embed\/)([^&?#\s]+)/)
  return m ? m[1] : null
}

function pickRandom(pool, count, exclude = []) {
  const excIds = new Set(exclude.map(s => s.id))
  const filtered = pool.filter(s => !excIds.has(s.id))
  return [...filtered].sort(() => Math.random() - 0.5).slice(0, count)
}

async function fetchYtTitle(url) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.title ?? null
  } catch {
    return null
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [playlists, setPlaylists] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jb-playlists') || '[]') }
    catch { return [] }
  })
  const [activeId, setActiveId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSong, setCurrentSong] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [myVote, setMyVote] = useState(null)

  // UI state
  const [newPlaylist, setNewPlaylist] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [urlErr, setUrlErr] = useState('')
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [editingPlaylistId, setEditingPlaylistId] = useState(null)
  const [editingName, setEditingName] = useState('')

  // Refs for stable access inside player callbacks
  const stateRef = useRef({})
  stateRef.current = { playlists, activeId, candidates }

  const playerRef = useRef(null)
  const playerReadyRef = useRef(false)
  const pendingRef = useRef(null)
  const playerDivRef = useRef(null)

  const activePlaylist = playlists.find(p => p.id === activeId) ?? null

  // Persist playlists
  useEffect(() => {
    localStorage.setItem('jb-playlists', JSON.stringify(playlists))
  }, [playlists])

  // ─── YouTube Player Setup ────────────────────────────────────────────────

  useEffect(() => {
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
            playerRef.current = localPlayer
            playerReadyRef.current = true
            if (pendingRef.current) {
              localPlayer.loadVideoById(pendingRef.current)
              pendingRef.current = null
            }
          },
          onStateChange(e) {
            if (!alive) return
            if (e.data === window.YT.PlayerState.ENDED) {
              advanceToWinner()
            }
          },
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      // Overwrite the global callback — in StrictMode second mount wins
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
      try { localPlayer?.destroy() } catch {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Player control ──────────────────────────────────────────────────────

  function playVideo(ytId) {
    if (playerReadyRef.current && playerRef.current) {
      playerRef.current.loadVideoById(ytId)
    } else {
      pendingRef.current = ytId
    }
  }

  // Called from YouTube onStateChange — uses refs to access fresh state
  function advanceToWinner() {
    const { candidates, activeId, playlists } = stateRef.current
    if (!candidates.length) return

    const maxV = Math.max(...candidates.map(c => c.votes))
    const winners = candidates.filter(c => c.votes === maxV)
    const winner = winners[Math.floor(Math.random() * winners.length)]

    const playlist = playlists.find(p => p.id === activeId)
    const next = playlist
      ? pickRandom(playlist.songs, 3, [winner]).map(s => ({ ...s, votes: 0 }))
      : []

    setCurrentSong(winner)
    setCandidates(next)
    setMyVote(null)
    playVideo(winner.ytId)
  }

  function startJukebox() {
    if (!activePlaylist?.songs.length) return
    const shuffled = [...activePlaylist.songs].sort(() => Math.random() - 0.5)
    const first = shuffled[0]
    const cands = shuffled.slice(1, 4).map(s => ({ ...s, votes: 0 }))
    setCurrentSong(first)
    setCandidates(cands)
    setMyVote(null)
    setIsPlaying(true)
    playVideo(first.ytId)
  }

  function stopJukebox() {
    setIsPlaying(false)
    setCurrentSong(null)
    setCandidates([])
    setMyVote(null)
    try { playerRef.current?.stopVideo() } catch {}
  }

  function vote(cid) {
    const prev = myVote
    if (prev === cid) {
      setCandidates(cs => cs.map(c =>
        c.id === cid ? { ...c, votes: Math.max(0, c.votes - 1) } : c
      ))
      setMyVote(null)
    } else {
      setCandidates(cs => cs.map(c => {
        if (c.id === prev) return { ...c, votes: Math.max(0, c.votes - 1) }
        if (c.id === cid) return { ...c, votes: c.votes + 1 }
        return c
      }))
      setMyVote(cid)
    }
  }

  // ─── Playlist CRUD ───────────────────────────────────────────────────────

  function addPlaylist() {
    const name = newPlaylist.trim()
    if (!name) return
    const id = genId()
    setPlaylists(p => [...p, { id, name, songs: [] }])
    setActiveId(id)
    setNewPlaylist('')
  }

  function deletePlaylist(id) {
    setPlaylists(p => p.filter(pl => pl.id !== id))
    if (activeId === id) { setActiveId(null); stopJukebox() }
  }

  function startEditPlaylist(pl) {
    setEditingPlaylistId(pl.id)
    setEditingName(pl.name)
  }

  function saveEditPlaylist() {
    const name = editingName.trim()
    if (name) setPlaylists(p => p.map(pl => pl.id === editingPlaylistId ? { ...pl, name } : pl))
    setEditingPlaylistId(null)
    setEditingName('')
  }

  // Auto-fetch title when URL field loses focus
  async function handleUrlBlur() {
    const url = newUrl.trim()
    if (!url || newTitle.trim()) return
    const ytId = extractYtId(url)
    if (!ytId) return
    setFetchingTitle(true)
    const title = await fetchYtTitle(url)
    if (title) setNewTitle(title)
    setFetchingTitle(false)
  }

  function addSong() {
    const url = newUrl.trim()
    const title = newTitle.trim()
    if (!url || !activeId) return
    const ytId = extractYtId(url)
    if (!ytId) { setUrlErr('Nieprawidłowy link YouTube'); return }
    const song = { id: genId(), url, title: title || url, ytId }
    setPlaylists(p => p.map(pl =>
      pl.id === activeId ? { ...pl, songs: [...pl.songs, song] } : pl
    ))
    setNewUrl('')
    setNewTitle('')
    setUrlErr('')
  }

  function deleteSong(sid) {
    setPlaylists(p => p.map(pl =>
      pl.id === activeId ? { ...pl, songs: pl.songs.filter(s => s.id !== sid) } : pl
    ))
  }

  const maxVotes = candidates.length ? Math.max(...candidates.map(c => c.votes)) : 0

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <span className="header-icon">🎵</span>
          <h1>JUKEBOX</h1>
        </div>
      </header>

      <main className="main">
        {/* ── Sidebar ── */}
        <aside className="sidebar">

          <div className="section">
            <h2 className="section-title">Playlisty</h2>

            <div className="playlist-list">
              {playlists.length === 0 && (
                <p className="empty-hint">Utwórz pierwszą playlistę poniżej</p>
              )}
              {playlists.map(pl => (
                <div key={pl.id} className={`playlist-item${pl.id === activeId ? ' active' : ''}`}>
                  {editingPlaylistId === pl.id ? (
                    <input
                      className="edit-input"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEditPlaylist()
                        if (e.key === 'Escape') setEditingPlaylistId(null)
                      }}
                      onBlur={saveEditPlaylist}
                      autoFocus
                    />
                  ) : (
                    <button className="playlist-name-btn" onClick={() => setActiveId(pl.id)}>
                      {pl.name}
                      <span className="count">{pl.songs.length}</span>
                    </button>
                  )}
                  <div className="playlist-actions">
                    <button className="btn-icon" title="Zmień nazwę" onClick={() => startEditPlaylist(pl)}>✎</button>
                    <button className="btn-icon danger" title="Usuń" onClick={() => deletePlaylist(pl.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="add-row">
              <input
                value={newPlaylist}
                onChange={e => setNewPlaylist(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPlaylist()}
                placeholder="Nazwa nowej playlisty..."
              />
              <button className="btn-accent" onClick={addPlaylist} title="Dodaj playlistę">+</button>
            </div>
          </div>

          {activePlaylist && (
            <div className="section songs-section">
              <h2 className="section-title">{activePlaylist.name}</h2>

              <div className="song-list">
                {activePlaylist.songs.length === 0 && (
                  <p className="empty-hint">Dodaj pierwszą piosenkę poniżej</p>
                )}
                {activePlaylist.songs.map(s => (
                  <div key={s.id} className="song-item">
                    <img
                      src={`https://img.youtube.com/vi/${s.ytId}/default.jpg`}
                      alt=""
                      className="song-thumb"
                    />
                    <span className="song-title">{s.title}</span>
                    <button className="btn-icon danger" onClick={() => deleteSong(s.id)}>✕</button>
                  </div>
                ))}
              </div>

              <div className="add-song-form">
                <input
                  value={newUrl}
                  onChange={e => { setNewUrl(e.target.value); setUrlErr('') }}
                  onBlur={handleUrlBlur}
                  onKeyDown={e => e.key === 'Enter' && addSong()}
                  placeholder="Link YouTube (youtube.com/watch?v=...)"
                  className={urlErr ? 'input-error' : ''}
                />
                <div className="title-row">
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSong()}
                    placeholder={fetchingTitle ? 'Pobieranie tytułu...' : 'Tytuł (pobierany automatycznie)'}
                    disabled={fetchingTitle}
                  />
                </div>
                {urlErr && <p className="error-msg">{urlErr}</p>}
                <button className="btn-primary" onClick={addSong}>+ Dodaj piosenkę</button>
              </div>

              <div className="play-controls">
                {!isPlaying ? (
                  <button
                    className="btn-start"
                    onClick={startJukebox}
                    disabled={activePlaylist.songs.length === 0}
                  >
                    ▶ START
                  </button>
                ) : (
                  <button className="btn-stop" onClick={stopJukebox}>■ STOP</button>
                )}
              </div>
            </div>
          )}

          {!activePlaylist && playlists.length > 0 && (
            <p className="empty-hint" style={{ padding: '1.5rem' }}>
              Kliknij playlistę aby ją wybrać.
            </p>
          )}
        </aside>

        {/* ── Player + Voting ── */}
        <div className="player-area">

          <div className="player-card">
            <div className="yt-wrapper">
              {/* YouTube replaces this div with an iframe */}
              <div ref={playerDivRef} />
              {!isPlaying && (
                <div className="player-overlay">
                  <span className="vinyl-icon">🎵</span>
                  <p>Wybierz playlistę i naciśnij START</p>
                </div>
              )}
            </div>

            {currentSong && (
              <div className="now-playing">
                <span className="now-label">TERAZ GRA</span>
                <span className="now-title">{currentSong.title}</span>
              </div>
            )}
          </div>

          {isPlaying && candidates.length > 0 && (
            <div className="voting-card">
              <h2 className="section-title voting-title">Zagłosuj na następną piosenkę</h2>
              <div className="candidates">
                {candidates.map(c => {
                  const isWinning = c.votes > 0 && c.votes === maxVotes
                  const isVoted = myVote === c.id
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
                        <span className="vote-count">{c.votes}</span>
                        <button
                          className={`btn-vote${isVoted ? ' active' : ''}`}
                          onClick={() => vote(c.id)}
                        >
                          {isVoted ? '✓ Zagłosowano' : '▲ Głosuj'}
                        </button>
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
        </div>
      </main>
    </div>
  )
}
