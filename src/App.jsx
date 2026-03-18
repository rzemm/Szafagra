import { useCallback, useEffect, useReducer, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { RoomHeader } from './components/RoomHeader'
import { PlaylistSidebar } from './components/PlaylistSidebar'
import { VotingPanel } from './components/VotingPanel'
import { GuestView } from './components/GuestView'
import { NowPlayingPanel } from './components/NowPlayingPanel'
import { useRoomAuth } from './hooks/useRoomAuth'
import { useRoomSubscriptions } from './hooks/useRoomSubscriptions'
import { useJukeboxPlayback } from './hooks/useJukeboxPlayback'
import { genId } from './lib/jukebox'
import { extractYtId, extractYtPlaylistId, fetchYtTitle, fetchYtPlaylistItems } from './lib/youtube'
import { addSuggestion, createPlaylist, createPlaylistWithSongs, deleteSuggestion, removePlaylist, renamePlaylist, replacePlaylistSongs, saveRoomSetting, toggleSkipVote, voteNextOption } from './services/jukeboxService'
import './App.css'

const initialUiState = {
  activePlaylistId: new URLSearchParams(window.location.search).get('playlist'),
  newPlaylistName: '',
  newSongUrl: '',
  newSongTitle: '',
  urlErr: '',
  fetchingTitle: false,
  ytPlaylistId: null,
  importingYtPlaylist: false,
  editingId: null,
  editingName: '',
  copied: null,
  joinUrl: '',
  viewAsGuest: false,
  sidebarOpen: true,
  collapsed: { settings: true, playlists: false, songs: true, suggestions: false },
  uiError: '',
}

function uiReducer(state, action) {
  switch (action.type) {
    case 'setActivePlaylist':
      return { ...state, activePlaylistId: action.payload }
    case 'initActivePlaylist': {
      const nextValue = typeof action.payload === 'function'
        ? action.payload(state.activePlaylistId)
        : action.payload
      return { ...state, activePlaylistId: nextValue }
    }
    case 'setField':
      return { ...state, [action.field]: action.value }
    case 'toggleField':
      return { ...state, [action.field]: !state[action.field] }
    case 'toggleSection': {
      const isCurrentlyOpen = !state.collapsed[action.key]
      const allClosed = { settings: true, playlists: true, songs: true, suggestions: true }
      return {
        ...state,
        collapsed: isCurrentlyOpen
          ? allClosed
          : { ...allClosed, [action.key]: false },
      }
    }
    case 'startPlaylistEdit':
      return { ...state, editingId: action.playlistId, editingName: action.name }
    case 'cancelPlaylistEdit':
      return { ...state, editingId: null, editingName: '' }
    case 'setUrlInput':
      return { ...state, newSongUrl: action.value, urlErr: '' }
    case 'songTitleFetchStart':
      return { ...state, fetchingTitle: true, urlErr: '' }
    case 'songTitleFetchEnd':
      return { ...state, fetchingTitle: false }
    case 'songAdded':
      return { ...state, newSongUrl: '', newSongTitle: '', urlErr: '' }
    case 'playlistAdded':
      return { ...state, activePlaylistId: action.playlistId, newPlaylistName: '' }
    case 'setCopied':
      return { ...state, copied: action.value }
    case 'setUiError':
      return { ...state, uiError: action.value }
    default:
      return state
  }
}

function sanitizeImportedSongs(songs) {
  if (!Array.isArray(songs)) return []

  return songs
    .map((song) => {
      const title = typeof song?.title === 'string' ? song.title.trim() : ''
      const ytId = typeof song?.ytId === 'string' ? song.ytId.trim() : ''
      const sourceUrl = typeof song?.url === 'string' ? song.url.trim() : ''
      const url = sourceUrl || (ytId ? `https://youtu.be/${ytId}` : '')

      if (!title || !ytId || !url) return null

      return {
        id: typeof song?.id === 'string' && song.id.trim() ? song.id.trim() : genId(),
        title,
        ytId,
        url,
      }
    })
    .filter(Boolean)
}

export default function App() {
  const [uiState, dispatch] = useReducer(uiReducer, initialUiState)
  const { user, roomId, isOwner, authReady } = useRoomAuth()

  const setInitialActivePlaylist = useCallback((updater) => {
    dispatch({ type: 'initActivePlaylist', payload: updater })
  }, [])

  const { playlists, jukeboxState, settings, guestToken, suggestions } = useRoomSubscriptions(roomId, setInitialActivePlaylist)

  const selectPlaylist = useCallback((playlistId) => {
    dispatch({ type: 'setActivePlaylist', payload: playlistId })
    const url = new URL(window.location.href)
    if (playlistId) url.searchParams.set('playlist', playlistId)
    else url.searchParams.delete('playlist')
    window.history.replaceState({}, '', url.toString())
  }, [])

  const playback = useJukeboxPlayback({
    authReady,
    isOwner,
    roomId,
    playlists,
    settings,
    jukeboxState,
    activePlaylistId: uiState.activePlaylistId,
    selectPlaylist,
  })

  const activePlaylist = playlists.find(playlist => playlist.id === uiState.activePlaylistId) ?? null
  const isPlaying = jukeboxState?.isPlaying ?? false
  const currentSong = jukeboxState?.currentSong ?? null
  const queue = jukeboxState?.queue ?? []
  const nextOptions = jukeboxState?.nextOptions ?? {}
  const nextVotesData = jukeboxState?.nextVotes ?? {}
  const nextOptionKeys = Object.keys(nextOptions).sort()
  const voteThreshold = settings?.voteThreshold ?? 1
  const skipThreshold = settings?.skipThreshold ?? 0
  const allowSuggestions = settings?.allowSuggestions ?? false
  const skipVoters = jukeboxState?.skipVoters ?? {}
  const skipCount = Object.keys(skipVoters).length
  const userId = user?.uid ?? null
  const mySkipVote = userId ? (skipVoters[userId] ?? false) : false
  const showOwnerUI = isOwner && !uiState.viewAsGuest

  const [panelOpen, setPanelOpen] = useState({ queue: true, qr: true, voting: true })
  const togglePanel = (key) => setPanelOpen(p => ({ ...p, [key]: !p[key] }))

  useEffect(() => {
    if (!uiState.copied) return
    const timeoutId = setTimeout(() => {
      dispatch({ type: 'setCopied', value: null })
    }, 2500)
    return () => clearTimeout(timeoutId)
  }, [uiState.copied])

  const setField = useCallback((field, value) => {
    dispatch({ type: 'setField', field, value })
  }, [])

  const toggleSection = useCallback((key) => {
    dispatch({ type: 'toggleSection', key })
  }, [])

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'toggleField', field: 'sidebarOpen' })
  }, [])

  const toggleViewAsGuest = useCallback(() => {
    dispatch({ type: 'toggleField', field: 'viewAsGuest' })
  }, [])

  const startEditPlaylist = useCallback((playlistId, name) => {
    dispatch({ type: 'startPlaylistEdit', playlistId, name })
  }, [])

  const cancelEditPlaylist = useCallback(() => {
    dispatch({ type: 'cancelPlaylistEdit' })
  }, [])

  const handleSongUrlChange = useCallback((value) => {
    dispatch({ type: 'setUrlInput', value })
  }, [])

  const executeAction = useCallback(async (action, errorMessage) => {
    dispatch({ type: 'setUiError', value: '' })
    try {
      return await action()
    } catch (error) {
      console.error(error)
      dispatch({ type: 'setUiError', value: errorMessage })
      return null
    }
  }, [])

  const saveSettings = useCallback(async (key, value) => {
    if (!roomId || !isOwner) return
    await executeAction(() => saveRoomSetting(roomId, key, value), 'Nie udało się zapisać ustawień.')
    if (key === 'queueSize') {
      await executeAction(() => playback.resizeVotingOptions(value), 'Nie udało się zaktualizować opcji głosowania.')
    }
  }, [executeAction, isOwner, playback.resizeVotingOptions, roomId])

  const vote = useCallback(async (optionKey) => {
    if (!user || !roomId || !jukeboxState) return
    const uid = user.uid
    const currentVote = (jukeboxState.nextVotes ?? {})[uid]
    await executeAction(() => voteNextOption(roomId, uid, optionKey, currentVote), 'Nie udało się zapisać głosu.')
  }, [executeAction, jukeboxState, roomId, user])

  const voteSkip = useCallback(async () => {
    if (!userId || !roomId || !isPlaying) return
    await executeAction(() => toggleSkipVote(roomId, userId, mySkipVote), 'Nie udało się zapisać głosu pominięcia.')
  }, [executeAction, isPlaying, mySkipVote, roomId, userId])

  const submitSuggestion = useCallback(async ({ title, ytId, url }) => {
    if (!roomId || !userId) return false
    const done = await executeAction(
      () => addSuggestion(roomId, userId, { title, ytId, url }),
      'Nie udało się wysłać propozycji.'
    )
    return done !== null
  }, [executeAction, roomId, userId])

  const approveSuggestion = useCallback(async (suggestion) => {
    if (!roomId || !activePlaylist) return
    const song = { id: genId(), title: suggestion.title, ytId: suggestion.ytId, url: suggestion.url }
    await executeAction(async () => {
      await replacePlaylistSongs(roomId, activePlaylist.id, [...(activePlaylist.songs ?? []), song])
      await deleteSuggestion(roomId, suggestion.id)
    }, 'Nie udało się zatwierdzić propozycji.')
  }, [activePlaylist, executeAction, roomId])

  const rejectSuggestion = useCallback(async (suggestionId) => {
    if (!roomId) return
    await executeAction(() => deleteSuggestion(roomId, suggestionId), 'Nie udało się odrzucić propozycji.')
  }, [executeAction, roomId])

  const addPlaylist = useCallback(async () => {
    const name = uiState.newPlaylistName.trim()
    if (!name || !roomId) return
    const ref = await executeAction(() => createPlaylist(roomId, name), 'Nie udało się utworzyć playlisty.')
    if (!ref) return
    dispatch({ type: 'playlistAdded', playlistId: ref.id })
    selectPlaylist(ref.id)
  }, [executeAction, roomId, selectPlaylist, uiState.newPlaylistName])

  const exportPlaylist = useCallback(() => {
    if (!activePlaylist) return

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      playlist: {
        name: activePlaylist.name,
        songs: activePlaylist.songs ?? [],
      },
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = (activePlaylist.name || 'playlist')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'playlist'

    link.href = url
    link.download = `${safeName}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [activePlaylist])

  const importPlaylist = useCallback(async (file) => {
    if (!file || !roomId) return

    const done = await executeAction(async () => {
      const raw = await file.text()
      const parsed = JSON.parse(raw)
      const playlistData = parsed?.playlist ?? parsed
      const name = typeof playlistData?.name === 'string' ? playlistData.name.trim() : ''
      const songs = sanitizeImportedSongs(playlistData?.songs)

      if (!name) {
        throw new Error('Imported playlist is missing a valid name.')
      }

      if (songs.length === 0) {
        throw new Error('Imported playlist does not contain valid songs.')
      }

      return createPlaylistWithSongs(roomId, name, songs)
    }, 'Nie udało się zaimportować playlisty z pliku JSON.')

    if (!done) return

    dispatch({ type: 'playlistAdded', playlistId: done.id })
    selectPlaylist(done.id)
  }, [executeAction, roomId, selectPlaylist])

  const deletePlaylist = useCallback(async (playlistId) => {
    if (!roomId) return
    const done = await executeAction(() => removePlaylist(roomId, playlistId), 'Nie udało się usunąć playlisty.')
    if (done === null) return
    if (uiState.activePlaylistId === playlistId) selectPlaylist(null)
  }, [executeAction, roomId, selectPlaylist, uiState.activePlaylistId])

  const saveEditPlaylist = useCallback(async () => {
    const name = uiState.editingName.trim()
    if (name && uiState.editingId && roomId) {
      await executeAction(() => renamePlaylist(roomId, uiState.editingId, name), 'Nie udało się zmienić nazwy playlisty.')
    }
    dispatch({ type: 'cancelPlaylistEdit' })
  }, [executeAction, roomId, uiState.editingId, uiState.editingName])

  const handleUrlBlur = useCallback(async () => {
    const url = uiState.newSongUrl.trim()
    if (!url) return

    // Check for playlist URL first
    const playlistId = extractYtPlaylistId(url)
    if (playlistId) {
      dispatch({ type: 'setField', field: 'ytPlaylistId', value: playlistId })
      return
    }

    dispatch({ type: 'setField', field: 'ytPlaylistId', value: null })
    if (uiState.newSongTitle.trim()) return

    const ytId = extractYtId(url)
    if (!ytId) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Nieprawidłowy link YouTube' })
      return
    }

    dispatch({ type: 'songTitleFetchStart' })
    const title = await executeAction(() => fetchYtTitle(url), 'Nie udało się pobrać tytułu utworu.')
    if (title) dispatch({ type: 'setField', field: 'newSongTitle', value: title })
    dispatch({ type: 'songTitleFetchEnd' })
  }, [executeAction, uiState.newSongTitle, uiState.newSongUrl])

  const importFromYouTube = useCallback(async () => {
    const { ytPlaylistId, activePlaylistId: plId } = uiState
    if (!ytPlaylistId || !plId || !roomId) return

    dispatch({ type: 'setField', field: 'importingYtPlaylist', value: true })
    const done = await executeAction(async () => {
      const fetched = await fetchYtPlaylistItems(ytPlaylistId)
      if (fetched.length === 0) throw new Error('Playlista pusta lub niedostępna przez API')
      const newSongs = fetched.map(s => ({ id: genId(), ...s }))
      const existing = activePlaylist?.songs ?? []
      return replacePlaylistSongs(roomId, plId, [...existing, ...newSongs])
    }, 'Nie udało się zaimportować playlisty YouTube.')
    dispatch({ type: 'setField', field: 'importingYtPlaylist', value: false })

    if (done !== null) {
      dispatch({ type: 'setField', field: 'newSongUrl', value: '' })
      dispatch({ type: 'setField', field: 'ytPlaylistId', value: null })
    }
  }, [activePlaylist, executeAction, roomId, uiState])

  const addSong = useCallback(async () => {
    const url = uiState.newSongUrl.trim()
    const title = uiState.newSongTitle.trim()
    if (!url || !uiState.activePlaylistId || !roomId) return

    const ytId = extractYtId(url)
    if (!ytId) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Nieprawidłowy link YouTube' })
      return
    }

    const cleanUrl = `https://youtu.be/${ytId}`
    const song = { id: genId(), url: cleanUrl, title: title || cleanUrl, ytId }
    const done = await executeAction(
      () => replacePlaylistSongs(roomId, uiState.activePlaylistId, [...(activePlaylist?.songs ?? []), song]),
      'Nie udało się dodać utworu.',
    )
    if (done === null) return
    dispatch({ type: 'songAdded' })
  }, [activePlaylist, executeAction, roomId, uiState.activePlaylistId, uiState.newSongTitle, uiState.newSongUrl])

  const deleteSong = useCallback(async (songId) => {
    if (!activePlaylist || !roomId) return
    await executeAction(
      () => replacePlaylistSongs(roomId, uiState.activePlaylistId, activePlaylist.songs.filter(song => song.id !== songId)),
      'Nie udało się usunąć utworu.',
    )
  }, [activePlaylist, executeAction, roomId, uiState.activePlaylistId])

  const copyAdminLink = useCallback(() => {
    const url = new URL(window.location.origin + window.location.pathname)
    url.searchParams.set('room', roomId ?? '')
    navigator.clipboard.writeText(url.toString()).then(() => dispatch({ type: 'setCopied', value: 'admin' }))
  }, [roomId])

  const voterUrl = guestToken
    ? (() => { const u = new URL(window.location.origin + window.location.pathname); u.searchParams.set('room', guestToken); return u.toString() })()
    : null

  const copyVoterLink = useCallback(() => {
    if (!voterUrl) return
    navigator.clipboard.writeText(voterUrl).then(() => dispatch({ type: 'setCopied', value: 'voter' }))
  }, [voterUrl])

  const handleJoinRoom = useCallback(() => {
    const input = uiState.joinUrl.trim()
    if (!input) return

    let targetRoomId = input
    try {
      const url = new URL(input)
      if (url.searchParams.get('room')) targetRoomId = url.searchParams.get('room')
    } catch (error) {
      void error
    }

    const destination = new URL(window.location.origin + window.location.pathname)
    destination.searchParams.set('room', targetRoomId)
    window.location.href = destination.toString()
  }, [uiState.joinUrl])

  if (!authReady) return <div className="splash"><div className="splash-icon">🎵</div><p>Łączenie...</p></div>

  return (
    <div className="app">
      {uiState.uiError && <div className="error-banner">{uiState.uiError}</div>}
      <RoomHeader
        showOwnerUI={showOwnerUI}
        isOwner={isOwner}
        sidebarOpen={uiState.sidebarOpen}
        toggleSidebar={toggleSidebar}
        copied={uiState.copied}
        copyAdminLink={copyAdminLink}
        copyVoterLink={copyVoterLink}
      />

      <main className="main">
        {showOwnerUI && <PlaylistSidebar
          sidebarOpen={uiState.sidebarOpen}
          showOwnerUI={showOwnerUI}
          collapsed={uiState.collapsed}
          toggleSection={toggleSection}
          voteMode={playback.voteMode}
          queueSize={Math.max(1, settings?.queueSize ?? 1)}
          voteThreshold={voteThreshold}
          skipThreshold={skipThreshold}
          saveSettings={saveSettings}
          isPlaying={isPlaying}
          playlists={playlists}
          activePlaylist={activePlaylist}
          activePlaylistId={uiState.activePlaylistId}
          editingId={uiState.editingId}
          editingName={uiState.editingName}
          startEditPlaylist={startEditPlaylist}
          cancelEditPlaylist={cancelEditPlaylist}
          setEditingName={(value) => setField('editingName', value)}
          saveEditPlaylist={saveEditPlaylist}
          selectPlaylist={selectPlaylist}
          startJukeboxWith={playback.startJukeboxWith}
          deletePlaylist={deletePlaylist}
          newPlaylistName={uiState.newPlaylistName}
          setNewPlaylistName={(value) => setField('newPlaylistName', value)}
          addPlaylist={addPlaylist}
          exportPlaylist={exportPlaylist}
          importPlaylist={importPlaylist}
          currentSong={currentSong}
          playSongNow={playback.playSongNow}
          deleteSong={deleteSong}
          newSongUrl={uiState.newSongUrl}
          setNewSongUrl={handleSongUrlChange}
          newSongTitle={uiState.newSongTitle}
          setNewSongTitle={(value) => setField('newSongTitle', value)}
          urlErr={uiState.urlErr}
          fetchingTitle={uiState.fetchingTitle}
          handleUrlBlur={handleUrlBlur}
          addSong={addSong}
          ytPlaylistId={uiState.ytPlaylistId}
          importingYtPlaylist={uiState.importingYtPlaylist}
          importFromYouTube={importFromYouTube}
          allowSuggestions={allowSuggestions}
          suggestions={suggestions}
          approveSuggestion={approveSuggestion}
          rejectSuggestion={rejectSuggestion}
        />}

        <div className={`player-area${showOwnerUI ? ' player-area-admin' : ''}`}>
          {showOwnerUI ? (
            <>
              <div className="admin-top-row">
                <div className="admin-col">
                  <div className="admin-queue-qr">
                    {isPlaying && (
                      <div className="voting-card">
                        <div className="panel-title-row" onClick={() => togglePanel('queue')}>
                          <h2 className="section-title voting-title">Zaraz zagra</h2>
                          <span className="section-arrow">{panelOpen.queue ? '▼' : '▶'}</span>
                        </div>
                        {panelOpen.queue && (
                          <ol className="queue-list">
                            {queue.map((song, index) => (
                              <li key={song.id} className="queue-item">
                                <span className="queue-pos">{index + 1}</span>
                                <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-thumb" />
                                <span className="queue-title">{song.title}</span>
                                <button className="btn-icon play" onClick={() => playback.playSongNow(song)}>▶</button>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    )}
                    {voterUrl && (
                      <div className="admin-qr-panel">
                        <div className="panel-title-row" onClick={() => togglePanel('qr')}>
                          <h2 className="section-title">Dołącz</h2>
                          <span className="section-arrow">{panelOpen.qr ? '▼' : '▶'}</span>
                        </div>
                        {panelOpen.qr && (
                          <>
                            <QRCodeSVG value={voterUrl} size={150} bgColor="#000000" fgColor="#ffffff" />
                            <p className="qr-url">{voterUrl}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <NowPlayingPanel
                  isPlaying={isPlaying}
                  currentSong={currentSong}
                  remaining={playback.remaining}
                  ytPlayerState={playback.ytPlayerState}
                  loadProgress={playback.loadProgress}
                  playerRef={playback.playerRef}
                  playerDivRef={playback.playerDivRef}
                  advanceToWinner={playback.advanceToWinner}
                  skipThreshold={skipThreshold}
                  skipCount={skipCount}
                  startJukeboxWith={playback.startJukeboxWith}
                  stopJukebox={playback.stopJukebox}
                  activePlaylistId={uiState.activePlaylistId}
                  activePlaylist={activePlaylist}
                />
              </div>

              {isPlaying && nextOptionKeys.length > 0 && (
                <div className="voting-panel-bottom">
                  <div className="panel-title-row" onClick={() => togglePanel('voting')}>
                    <h2 className="section-title">Zagłosuj na następne</h2>
                    <span className="section-arrow">{panelOpen.voting ? '▼' : '▶'}</span>
                  </div>
                  {panelOpen.voting && (
                    <VotingPanel
                      nextOptionKeys={nextOptionKeys}
                      nextOptions={nextOptions}
                      nextVotesData={nextVotesData}
                      userId={userId}
                      onVote={vote}
                      showPlayNow
                      onPlayNow={playback.playSongNow}
                      columns
                      onChooseOption={playback.advanceToOption}
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            <GuestView
              isOwner={isOwner}
              playerDivRef={playback.playerDivRef}
              isPlaying={isPlaying}
              currentSong={currentSong}
              remaining={playback.remaining}
              queue={queue}
              nextOptionKeys={nextOptionKeys}
              nextOptions={nextOptions}
              nextVotesData={nextVotesData}
              userId={userId}
              vote={vote}
              skipThreshold={skipThreshold}
              mySkipVote={mySkipVote}
              voteSkip={voteSkip}
              allowSuggestions={allowSuggestions}
              submitSuggestion={submitSuggestion}
            />
          )}
        </div>
      </main>
    </div>
  )
}
