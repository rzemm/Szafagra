import { useCallback, useEffect, useReducer, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { GuestView } from './components/GuestView'
import { NowPlayingPanel } from './components/NowPlayingPanel'
import { PlaylistSidebar } from './components/PlaylistSidebar'
import { RoomHeader } from './components/RoomHeader'
import { VotingPanel } from './components/VotingPanel'
import { useJukeboxPlayback } from './hooks/useJukeboxPlayback'
import { usePlaylistActions } from './hooks/usePlaylistActions'
import { useRoomAuth } from './hooks/useRoomAuth'
import { useRoomSubscriptions } from './hooks/useRoomSubscriptions'
import { useShareLinks } from './hooks/useShareLinks'
import { useSongActions } from './hooks/useSongActions'
import { genId } from './lib/jukebox'
import { addSuggestion, deleteSuggestion, incrementPlaylistVotes, ratePlaylist, replacePlaylistSongs, saveRoomSetting, toggleSkipVote, voteNextOption } from './services/jukeboxService'
import './App.css'

function NotePicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="note-picker-notes">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          className={`note-icon-btn${(hover ? hover >= n : value >= n) ? ' active' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          title={`${n} utwór${n === 1 ? '' : n < 5 ? 'y' : 'ów'} w grupie`}
        >♪</button>
      ))}
    </div>
  )
}

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

export default function App() {
  const [uiState, dispatch] = useReducer(uiReducer, initialUiState)
  const [panelOpen, setPanelOpen] = useState({ queue: true, qr: true, voting: true })
  const { user, roomId, isOwner, authReady, needsLogin, signInWithGoogle } = useRoomAuth()

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

  const {
    playerDivRef,
    playerRef,
    ytPlayerState,
    loadProgress,
    remaining,
    playSongNow,
    advanceToWinner,
    advanceToOption,
    resizeVotingOptions,
    startJukeboxWith,
    stopJukebox,
    voteMode,
  } = playback

  const activePlaylist = playlists.find((playlist) => playlist.id === uiState.activePlaylistId) ?? null
  const isPlaying = jukeboxState?.isPlaying ?? false
  const currentSong = jukeboxState?.currentSong ?? null
  const queue = jukeboxState?.queue ?? []
  const nextOptions = jukeboxState?.nextOptions ?? {}
  const nextVotesData = jukeboxState?.nextVotes ?? {}
  const nextOptionKeys = Object.keys(nextOptions).sort()
  const voteThreshold = settings?.voteThreshold ?? 1
  const skipThreshold = settings?.skipThreshold ?? 0
  const allowSuggestions = settings?.allowSuggestions ?? false
  const showThumbnails = settings?.showThumbnails ?? true
  const skipVoters = jukeboxState?.skipVoters ?? {}
  const skipCount = Object.keys(skipVoters).length
  const userId = user?.uid ?? null
  const mySkipVote = userId ? (skipVoters[userId] ?? false) : false
  const showOwnerUI = isOwner

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
      await executeAction(() => resizeVotingOptions(value), 'Nie udało się zaktualizować opcji głosowania.')
    }
  }, [executeAction, isOwner, resizeVotingOptions, roomId])

  const vote = useCallback(async (optionKey) => {
    if (!user || !roomId || !jukeboxState) return
    const uid = user.uid
    const currentVote = (jukeboxState.nextVotes ?? {})[uid]
    if (currentVote !== optionKey) {
      const pid = jukeboxState.activePlaylistId
      if (pid) incrementPlaylistVotes(roomId, pid).catch(() => {})
    }
    await executeAction(() => voteNextOption(roomId, uid, optionKey, currentVote), 'Nie udało się zapisać głosu.')
  }, [executeAction, jukeboxState, roomId, user])

  const voteSkip = useCallback(async () => {
    if (!userId || !roomId || !isPlaying) return
    await executeAction(() => toggleSkipVote(roomId, userId, mySkipVote), 'Nie udało się zapisać głosu pominięcia.')
  }, [executeAction, isPlaying, mySkipVote, roomId, userId])

  const playingPlaylistId = jukeboxState?.activePlaylistId ?? null
  const playingPlaylist = playlists.find(p => p.id === playingPlaylistId) ?? null
  const myRating = (playingPlaylist?.ratings ?? {})[userId] ?? 0

  const rateActivePlaylist = useCallback(async (score) => {
    if (!userId || !roomId || !playingPlaylistId) return
    await ratePlaylist(roomId, playingPlaylistId, userId, score)
  }, [userId, roomId, playingPlaylistId])

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

  const playlistActions = usePlaylistActions({
    roomId,
    activePlaylist,
    activePlaylistId: uiState.activePlaylistId,
    newPlaylistName: uiState.newPlaylistName,
    editingId: uiState.editingId,
    editingName: uiState.editingName,
    executeAction,
    selectPlaylist,
    dispatch,
    genId,
  })

  const songActions = useSongActions({
    roomId,
    activePlaylist,
    activePlaylistId: uiState.activePlaylistId,
    newSongUrl: uiState.newSongUrl,
    newSongTitle: uiState.newSongTitle,
    ytPlaylistId: uiState.ytPlaylistId,
    executeAction,
    dispatch,
    genId,
  })

  const shareLinks = useShareLinks({
    roomId,
    guestToken,
    onCopied: (value) => dispatch({ type: 'setCopied', value }),
  })

  const togglePanel = useCallback((key) => {
    setPanelOpen((current) => ({ ...current, [key]: !current[key] }))
  }, [])

  if (!authReady) return <div className="splash"><div className="splash-icon">🎵</div><p>Łączenie...</p></div>

  if (needsLogin) return (
    <div className="splash">
      <div className="splash-icon">🎵</div>
      <h1 className="login-title">Szafagra</h1>
      <p className="login-subtitle">Zaloguj się, aby zarządzać swoim jukeboxem</p>
      <button className="btn-google-login" onClick={signInWithGoogle}>
        <svg className="google-icon" viewBox="0 0 48 48" width="20" height="20">
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.9 7.2v6h7.9c4.6-4.2 7.3-10.5 7.3-17.2z"/>
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.9-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.1 0-11.2-4.1-13-9.6H2.8v6.2C6.7 42.6 14.8 48 24 48z"/>
          <path fill="#FBBC05" d="M11 28.9c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4v-6.2H2.8C1 17.6 0 20.7 0 24s1 6.4 2.8 9.1l8.2-4.2z"/>
          <path fill="#EA4335" d="M24 9.5c3.4 0 6.5 1.2 8.9 3.5l6.6-6.6C35.9 2.5 30.5 0 24 0 14.8 0 6.7 5.4 2.8 13.3l8.2 4.2C12.8 13.6 17.9 9.5 24 9.5z"/>
        </svg>
        Zaloguj się przez Google
      </button>
    </div>
  )

  return (
    <div className="app">
      {uiState.uiError && <div className="error-banner">{uiState.uiError}</div>}
      <RoomHeader
        showOwnerUI={showOwnerUI}
        sidebarOpen={uiState.sidebarOpen}
        toggleSidebar={toggleSidebar}
        copied={uiState.copied}
        copyAdminLink={shareLinks.copyAdminLink}
        newSongUrl={uiState.newSongUrl}
        setNewSongUrl={handleSongUrlChange}
        handleUrlBlur={songActions.handleUrlBlur}
        addSong={songActions.addSong}
        newSongTitle={uiState.newSongTitle}
        fetchingTitle={uiState.fetchingTitle}
        urlErr={uiState.urlErr}
        activePlaylist={activePlaylist}
      />

      <main className="main">
        {showOwnerUI && (
          <PlaylistSidebar
            sidebarOpen={uiState.sidebarOpen}
            showOwnerUI={showOwnerUI}
            collapsed={uiState.collapsed}
            toggleSection={toggleSection}
            voteMode={voteMode}
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
            saveEditPlaylist={playlistActions.saveEditPlaylist}
            selectPlaylist={selectPlaylist}
            startJukeboxWith={startJukeboxWith}
            deletePlaylist={playlistActions.deletePlaylist}
            newPlaylistName={uiState.newPlaylistName}
            setNewPlaylistName={(value) => setField('newPlaylistName', value)}
            addPlaylist={playlistActions.addPlaylist}
            exportPlaylist={playlistActions.exportPlaylist}
            importPlaylist={playlistActions.importPlaylist}
            currentSong={currentSong}
            playSongNow={playSongNow}
            deleteSong={songActions.deleteSong}
            ytPlaylistId={uiState.ytPlaylistId}
            importingYtPlaylist={uiState.importingYtPlaylist}
            importFromYouTube={songActions.importFromYouTube}
            allowSuggestions={allowSuggestions}
            suggestions={suggestions}
            approveSuggestion={approveSuggestion}
            rejectSuggestion={rejectSuggestion}
            showThumbnails={showThumbnails}
          />
        )}

        <div className={`player-area${showOwnerUI ? ' player-area-admin' : ''}`}>
          {showOwnerUI ? (
            <>
              <div className="admin-scroll-area">
                <div className="admin-top-row">
                  <div className="admin-col">
                    <div className="admin-queue-qr">
                      <div className="voting-card">
                        <div className="panel-title-row" onClick={() => togglePanel('queue')}>
                          <h2 className="section-title voting-title">Kolejka</h2>
                          {panelOpen.queue && (
                            <div className="panel-header-setting" onClick={(e) => e.stopPropagation()}>
                              <span className="panel-header-label">Min. zakolejkowanych:</span>
                              <div className="note-picker note-picker-sm">
                                {[0, 1, 2, 3, 4].map((count) => (
                                  <button key={count} className={`note-btn${voteThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('voteThreshold', count)}>
                                    {count}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <span className="section-arrow">{panelOpen.queue ? '▼' : '▶'}</span>
                        </div>
                        {isPlaying && panelOpen.queue && queue.length > 0 && (
                          <ol className="queue-list">
                            {queue.map((song, index) => (
                              <li key={song.id} className="queue-item">
                                <span className="queue-pos">{index + 1}</span>
                                {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-thumb" />}
                                <span className="queue-title">{song.title}</span>
                                <button className="btn-icon play" onClick={() => playSongNow(song)}>▶</button>
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                      {shareLinks.voterUrl && (
                        <div className="admin-qr-panel">
                          <div className="panel-title-row" onClick={() => togglePanel('qr')}>
                            <h2 className="section-title">Zeskanuj kod i zagłosuj na następny utwór</h2>
                            <span className="section-arrow">{panelOpen.qr ? '▼' : '▶'}</span>
                          </div>
                          {panelOpen.qr && (
                            <>
                              <div className="qr-clickable" onClick={shareLinks.copyVoterLink} title="Kliknij aby skopiować link">
                                <QRCodeSVG value={shareLinks.voterUrl} size={150} bgColor="#000000" fgColor="#ffffff" />
                                {uiState.copied === 'voter' && <div className="qr-copied-overlay">✓ Skopiowano</div>}
                              </div>
                              <p className="qr-hint">Kliknij na QR code aby skopiować linka</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <NowPlayingPanel
                    isPlaying={isPlaying}
                    currentSong={currentSong}
                    remaining={remaining}
                    ytPlayerState={ytPlayerState}
                    loadProgress={loadProgress}
                    playerRef={playerRef}
                    playerDivRef={playerDivRef}
                    advanceToWinner={advanceToWinner}
                    skipThreshold={skipThreshold}
                    skipCount={skipCount}
                    startJukeboxWith={startJukeboxWith}
                    stopJukebox={stopJukebox}
                    activePlaylistId={uiState.activePlaylistId}
                    activePlaylist={activePlaylist}
                  />
                </div>
              </div>

              <div className="voting-panel-bottom">
                {/* column-reverse: pierwszy element = wizualnie na dole (pasek tytułu) */}
                <div className="voting-bottom-bar" onClick={() => togglePanel('voting')}>
                  <h2 className="section-title">Głosowanie</h2>
                  <span className="section-arrow">{panelOpen.voting ? '▼' : '▲'}</span>
                </div>
                {panelOpen.voting && (
                  <div className="voting-bottom-content">
                    {isPlaying && nextOptionKeys.length > 0 && (
                      <VotingPanel
                        nextOptionKeys={nextOptionKeys}
                        nextOptions={nextOptions}
                        nextVotesData={nextVotesData}
                        userId={userId}
                        onVote={vote}
                        showPlayNow
                        onPlayNow={playSongNow}
                        columns
                        onChooseOption={advanceToOption}
                        showThumbnails={showThumbnails}
                      />
                    )}
                    <div className="queue-size-row">
                      <span className="queue-size-label">Utworów w grupie:</span>
                      <NotePicker value={Math.max(1, settings?.queueSize ?? 1)} onChange={(n) => saveSettings('queueSize', n)} />
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <GuestView
              isOwner={isOwner}
              playerDivRef={playerDivRef}
              isPlaying={isPlaying}
              currentSong={currentSong}
              remaining={remaining}
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
              myRating={myRating}
              onRate={rateActivePlaylist}
              showThumbnails={showThumbnails}
            />
          )}
        </div>
      </main>
    </div>
  )
}
