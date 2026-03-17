import { useCallback, useEffect, useReducer } from 'react'
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
import { createPlaylist, removePlaylist, renamePlaylist, replacePlaylistSongs, saveRoomSetting, toggleSkipVote, voteNextOption } from './services/jukeboxService'
import './App.css'

const initialUiState = {
  activePlaylistId: new URLSearchParams(window.location.search).get('playlist'),
  newPlaylistName: '',
  newSongUrl: '',
  newSongTitle: '',
  urlErr: '',
  fetchingTitle: false,
  editingId: null,
  editingName: '',
  copied: false,
  joinUrl: '',
  viewAsGuest: false,
  sidebarOpen: true,
  collapsed: {},
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
    case 'toggleSection':
      return {
        ...state,
        collapsed: {
          ...state.collapsed,
          [action.key]: !state.collapsed[action.key],
        },
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

export default function App() {
  const [uiState, dispatch] = useReducer(uiReducer, initialUiState)
  const { user, roomId, isOwner, authReady } = useRoomAuth()

  const setInitialActivePlaylist = useCallback((updater) => {
    dispatch({ type: 'initActivePlaylist', payload: updater })
  }, [])

  const { playlists, jukeboxState, settings } = useRoomSubscriptions(roomId, setInitialActivePlaylist)

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
  const skipVoters = jukeboxState?.skipVoters ?? {}
  const skipCount = Object.keys(skipVoters).length
  const userId = user?.uid ?? null
  const mySkipVote = userId ? (skipVoters[userId] ?? false) : false
  const showOwnerUI = isOwner && !uiState.viewAsGuest

  useEffect(() => {
    if (!uiState.copied) return
    const timeoutId = setTimeout(() => {
      dispatch({ type: 'setCopied', value: false })
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

  const addPlaylist = useCallback(async () => {
    const name = uiState.newPlaylistName.trim()
    if (!name || !roomId) return
    const ref = await executeAction(() => createPlaylist(roomId, name), 'Nie udało się utworzyć playlisty.')
    if (!ref) return
    dispatch({ type: 'playlistAdded', playlistId: ref.id })
    selectPlaylist(ref.id)
  }, [executeAction, roomId, selectPlaylist, uiState.newPlaylistName])

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
    if (!url || uiState.newSongTitle.trim()) return

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

  const copyLink = useCallback(() => navigator.clipboard.writeText(roomId ?? '').then(() => {
    dispatch({ type: 'setCopied', value: true })
  }), [roomId])

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
        viewAsGuest={uiState.viewAsGuest}
        toggleViewAsGuest={toggleViewAsGuest}
        copied={uiState.copied}
        copyLink={copyLink}
      />

      <main className="main">
        <PlaylistSidebar
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
          copied={uiState.copied}
          copyLink={copyLink}
          joinUrl={uiState.joinUrl}
          setJoinUrl={(value) => setField('joinUrl', value)}
          handleJoinRoom={handleJoinRoom}
        />

        <div className={`player-area${showOwnerUI ? ' player-area-admin' : ''}`}>
          {showOwnerUI ? (
            <>
              <div className="admin-top-row">
                <div className="admin-col">
                  {isPlaying && (
                    <div className="voting-card">
                      <h2 className="section-title voting-title">Zaraz zagra</h2>
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
                    </div>
                  )}
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
            />
          )}
        </div>
      </main>
    </div>
  )
}
