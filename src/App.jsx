import { useState } from 'react'
import { addDoc, collection, deleteDoc, deleteField, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { RoomHeader } from './components/RoomHeader'
import { PlaylistSidebar } from './components/PlaylistSidebar'
import { VotingPanel } from './components/VotingPanel'
import { GuestView } from './components/GuestView'
import { NowPlayingPanel } from './components/NowPlayingPanel'
import { useRoomAuth } from './hooks/useRoomAuth'
import { useRoomSubscriptions } from './hooks/useRoomSubscriptions'
import { useJukeboxPlayback } from './hooks/useJukeboxPlayback'
import { genId } from './lib/jukebox'
import { extractYtId, fetchYtTitle } from './lib/youtube'
import './App.css'

const STATE_ID = 'main'

export default function App() {
  const [activePlaylistId, setActivePlaylistId] = useState(() => new URLSearchParams(window.location.search).get('playlist'))
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newSongUrl, setNewSongUrl] = useState('')
  const [newSongTitle, setNewSongTitle] = useState('')
  const [urlErr, setUrlErr] = useState('')
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [copied, setCopied] = useState(false)
  const [joinUrl, setJoinUrl] = useState('')
  const [viewAsGuest, setViewAsGuest] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [collapsed, setCollapsed] = useState({})

  const { user, roomId, isOwner, authReady } = useRoomAuth()
  const { playlists, jukeboxState, settings } = useRoomSubscriptions(roomId, setActivePlaylistId)

  const selectPlaylist = pid => {
    setActivePlaylistId(pid)
    const url = new URL(window.location.href)
    if (pid) url.searchParams.set('playlist', pid)
    else url.searchParams.delete('playlist')
    window.history.replaceState({}, '', url.toString())
  }

  const playback = useJukeboxPlayback({ authReady, isOwner, roomId, playlists, settings, jukeboxState, activePlaylistId, selectPlaylist })

  const activePlaylist = playlists.find(p => p.id === activePlaylistId) ?? null
  const isPlaying = jukeboxState?.isPlaying ?? false
  const currentSong = jukeboxState?.currentSong ?? null
  const queue = jukeboxState?.queue ?? []
  const nextOptions = jukeboxState?.nextOptions ?? {}
  const nextVotesData = jukeboxState?.nextVotes ?? {}
  const nextOptionKeys = Object.keys(nextOptions).sort()
  const voteThreshold = settings?.voteThreshold ?? 1
  const skipThreshold = settings?.skipThreshold ?? 0
  const skipVoters = jukeboxState?.skipVoters ?? {}
  const skipCount = Object.keys(skipVoters).length
  const mySkipVote = skipVoters[user?.uid] ?? false
  const showOwnerUI = isOwner && !viewAsGuest

  const toggleSection = key => setCollapsed(s => ({ ...s, [key]: !s[key] }))

  const saveSettings = async (key, value) => {
    if (!roomId || !isOwner) return
    await updateDoc(doc(db, 'rooms', roomId), { [`settings.${key}`]: value })
  }

  const vote = async optionKey => {
    if (!user || !roomId || !jukeboxState) return
    const uid = user.uid
    const ref = doc(db, 'rooms', roomId, 'state', STATE_ID)
    const currentVote = (jukeboxState.nextVotes ?? {})[uid]
    await updateDoc(ref, currentVote === optionKey ? { [`nextVotes.${uid}`]: deleteField() } : { [`nextVotes.${uid}`]: optionKey })
  }

  const voteSkip = async () => {
    if (!user || !roomId || !isPlaying) return
    const uid = user.uid
    const ref = doc(db, 'rooms', roomId, 'state', STATE_ID)
    await updateDoc(ref, skipVoters[uid] ? { [`skipVoters.${uid}`]: deleteField() } : { [`skipVoters.${uid}`]: true })
  }

  const addPlaylist = async () => {
    const name = newPlaylistName.trim()
    if (!name || !roomId) return
    const ref = await addDoc(collection(db, 'rooms', roomId, 'playlists'), { name, songs: [], createdAt: serverTimestamp() })
    setActivePlaylistId(ref.id)
    setNewPlaylistName('')
  }

  const deletePlaylist = async id => {
    if (!roomId) return
    await deleteDoc(doc(db, 'rooms', roomId, 'playlists', id))
    if (activePlaylistId === id) setActivePlaylistId(null)
  }

  const saveEditPlaylist = async () => {
    const name = editingName.trim()
    if (name && editingId && roomId) await updateDoc(doc(db, 'rooms', roomId, 'playlists', editingId), { name })
    setEditingId(null)
    setEditingName('')
  }

  const handleUrlBlur = async () => {
    const url = newSongUrl.trim()
    if (!url || newSongTitle.trim()) return
    const ytId = extractYtId(url)
    if (!ytId) return setUrlErr('Nieprawidłowy link YouTube')
    setUrlErr('')
    setFetchingTitle(true)
    const title = await fetchYtTitle(url)
    if (title) setNewSongTitle(title)
    setFetchingTitle(false)
  }

  const addSong = async () => {
    const url = newSongUrl.trim()
    const title = newSongTitle.trim()
    if (!url || !activePlaylistId || !roomId) return
    const ytId = extractYtId(url)
    if (!ytId) return setUrlErr('Nieprawidłowy link YouTube')
    const cleanUrl = `https://youtu.be/${ytId}`
    const song = { id: genId(), url: cleanUrl, title: title || cleanUrl, ytId }
    await updateDoc(doc(db, 'rooms', roomId, 'playlists', activePlaylistId), { songs: [...(activePlaylist?.songs ?? []), song] })
    setNewSongUrl('')
    setNewSongTitle('')
    setUrlErr('')
  }

  const deleteSong = async sid => {
    if (!activePlaylist || !roomId) return
    await updateDoc(doc(db, 'rooms', roomId, 'playlists', activePlaylistId), { songs: activePlaylist.songs.filter(s => s.id !== sid) })
  }

  const copyLink = () => navigator.clipboard.writeText(window.location.href).then(() => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  })

  const handleJoinRoom = () => {
    const input = joinUrl.trim()
    if (!input) return
    let targetRoomId = input
    try { const u = new URL(input); if (u.searchParams.get('room')) targetRoomId = u.searchParams.get('room') } catch {}
    const dest = new URL(window.location.origin + window.location.pathname)
    dest.searchParams.set('room', targetRoomId)
    window.location.href = dest.toString()
  }

  if (!authReady) return <div className="splash"><div className="splash-icon">🎵</div><p>Łączenie...</p></div>

  return (
    <div className="app">
      <RoomHeader showOwnerUI={showOwnerUI} isOwner={isOwner} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} viewAsGuest={viewAsGuest} setViewAsGuest={setViewAsGuest} copied={copied} copyLink={copyLink} />
      <main className="main">
        <PlaylistSidebar
          sidebarOpen={sidebarOpen}
          showOwnerUI={showOwnerUI}
          collapsed={collapsed}
          toggleSection={toggleSection}
          voteMode={playback.voteMode}
          queueSize={Math.max(1, settings?.queueSize ?? 1)}
          voteThreshold={voteThreshold}
          skipThreshold={skipThreshold}
          saveSettings={saveSettings}
          isPlaying={isPlaying}
          playlists={playlists}
          activePlaylist={activePlaylist}
          activePlaylistId={activePlaylistId}
          editingId={editingId}
          editingName={editingName}
          setEditingId={setEditingId}
          setEditingName={setEditingName}
          saveEditPlaylist={saveEditPlaylist}
          selectPlaylist={selectPlaylist}
          startJukeboxWith={playback.startJukeboxWith}
          deletePlaylist={deletePlaylist}
          newPlaylistName={newPlaylistName}
          setNewPlaylistName={setNewPlaylistName}
          addPlaylist={addPlaylist}
          currentSong={currentSong}
          playSongNow={playback.playSongNow}
          deleteSong={deleteSong}
          newSongUrl={newSongUrl}
          setNewSongUrl={setNewSongUrl}
          newSongTitle={newSongTitle}
          setNewSongTitle={setNewSongTitle}
          urlErr={urlErr}
          setUrlErr={setUrlErr}
          fetchingTitle={fetchingTitle}
          handleUrlBlur={handleUrlBlur}
          addSong={addSong}
          stopJukebox={playback.stopJukebox}
          copied={copied}
          copyLink={copyLink}
          joinUrl={joinUrl}
          setJoinUrl={setJoinUrl}
          handleJoinRoom={handleJoinRoom}
        />

        <div className={`player-area${showOwnerUI ? ' player-area-admin' : ''}`}>
          {showOwnerUI ? (
            <>
              <div className="admin-col">{isPlaying && <div className="voting-card"><h2 className="section-title voting-title">Zaraz zagra</h2><ol className="queue-list">{queue.map((song, i) => <li key={song.id} className="queue-item"><span className="queue-pos">{i + 1}</span><img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-thumb" /><span className="queue-title">{song.title}</span><button className="btn-icon play" onClick={() => playback.playSongNow(song)}>▶</button></li>)}</ol></div>}</div>
              <NowPlayingPanel isPlaying={isPlaying} currentSong={currentSong} remaining={playback.remaining} ytPlayerState={playback.ytPlayerState} loadProgress={playback.loadProgress} playerRef={playback.playerRef} playerDivRef={playback.playerDivRef} advanceToWinner={playback.advanceToWinner} skipThreshold={skipThreshold} skipCount={skipCount} />
              <div className="admin-col">{isPlaying && queue.length <= voteThreshold && nextOptionKeys.length > 0 && <VotingPanel nextOptionKeys={nextOptionKeys} nextOptions={nextOptions} nextVotesData={nextVotesData} userId={user?.uid} onVote={vote} showPlayNow onPlayNow={playback.playSongNow} />}</div>
            </>
          ) : (
            <GuestView isOwner={isOwner} playerDivRef={playback.playerDivRef} isPlaying={isPlaying} currentSong={currentSong} remaining={playback.remaining} queue={queue} voteThreshold={voteThreshold} nextOptionKeys={nextOptionKeys} nextOptions={nextOptions} nextVotesData={nextVotesData} userId={user?.uid} vote={vote} skipThreshold={skipThreshold} mySkipVote={mySkipVote} voteSkip={voteSkip} />
          )}
        </div>
      </main>
    </div>
  )
}
