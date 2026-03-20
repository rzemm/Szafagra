import { useCallback, useEffect, useReducer, useState } from 'react'
import { seedSampleRooms } from './dev/seedRooms'
import { QRCodeSVG } from 'qrcode.react'
import { GuestView } from './components/GuestView'
import { ScrollText } from './components/ScrollText'
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
import {
  addSuggestion,
  createPrivateRoom,
  createPrivateRoomCopy,
  createPublicRoom,
  deleteRoom,
  deleteSuggestion,
  incrementRoomVotes,
  rateRoom,
  replaceRoomSongs,
  saveRoomSetting,
  setMainState,
  subscribeLatestRooms,
  subscribeOwnedRooms,
  toggleSkipVote,
  voteNextOption,
} from './services/jukeboxService'
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
          title={`${n} utwor${n === 1 ? '' : n < 5 ? 'y' : 'ow'} w grupie`}
        >♪</button>
      ))}
    </div>
  )
}

const GoogleLogoSvg = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

function useOwnedRooms(uid, enabled) {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    if (!enabled || !uid) return
    return subscribeOwnedRooms(uid, setRooms)
  }, [enabled, uid])

  return enabled && uid ? rooms : []
}

function useLatestForeignRooms(uid, enabled) {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    if (!enabled || !uid) return
    return subscribeLatestRooms((latestRooms) => {
      setRooms(
        latestRooms
          .filter((room) => room.ownerId !== uid)
          .filter((room) => (room.songs?.length ?? 0) > 0)
          .filter((room) => room.settings?.isVisible !== false)
          .slice(0, 5)
      )
    })
  }, [enabled, uid])

  return enabled && uid ? rooms : []
}

function HomePage({ onCreateRoom, creatingRoom, user, onSignIn, onSignOut, ownedRooms, latestForeignRooms, onDeleteRoom }) {
  const [roomInput, setRoomInput] = useState('')
  const [seeding, setSeeding] = useState(false)
  const isLoggedIn = user && !user.isAnonymous

  const handleSeed = async () => {
    if (!window.confirm('Utworzyc 5 przykladowych list w bazie danych?')) return
    setSeeding(true)
    try {
      await seedSampleRooms()
      alert('Gotowe! Odswież strone, aby zobaczyc listy.')
    } catch (err) {
      alert('Blad: ' + err.message)
    }
    setSeeding(false)
  }

  const handleJoin = () => {
    const rawInput = roomInput.trim()
    if (!rawInput) return

    let roomValue = rawInput

    try {
      const parsedUrl = new URL(rawInput)
      roomValue = parsedUrl.searchParams.get('room')?.trim() || parsedUrl.pathname.replace(/^\/+|\/+$/g, '') || rawInput
    } catch {
      roomValue = rawInput
    }

    if (!roomValue) return
    window.location.href = `/?room=${encodeURIComponent(roomValue)}`
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleJoin()
  }

  return (
    <div className="homepage">
      <div className="homepage-top">
        <div className="homepage-logo">
          <span className="homepage-logo-icon">🎵</span>
          <span className="header-logo">szafi.fi</span>
        </div>
        {isLoggedIn ? (
          <div className="home-user-bar">
            {user.photoURL && <img src={user.photoURL} alt="" className="home-user-avatar" referrerPolicy="no-referrer" />}
            <span className="home-user-name">{user.displayName}</span>
            <button className="home-user-logout" onClick={onSignOut}>Wyloguj</button>
          </div>
        ) : (
          <div className="home-google-signin">
            <button className="home-google-btn" onClick={onSignIn}>
              <GoogleLogoSvg />
              Zaloguj sie przez Google
            </button>
            <p className="home-google-hint">aby zobaczyc swoje prywatne pokoje</p>
          </div>
        )}
      </div>

      <div className="homepage-body">
        <div className="homepage-col">
          <p className="home-col-title">Twoje pokoje</p>
          <div className="home-rooms-list">
            {isLoggedIn ? (
              ownedRooms.length > 0 ? (
                ownedRooms.map((ownedRoom) => (
                  <div key={ownedRoom.id} className={`home-room-card home-room-card--admin${ownedRoom.isPlaying ? ' home-room-card--playing' : ''}`}>
                    <a className="home-room-card-link" href={`/?room=${ownedRoom.id}`}>
                      <span className="home-room-icon">🎛</span>
                      <span className="home-room-label">{ownedRoom.name || 'Pokoj prywatny'}</span>
                    </a>
                    <button
                      className="home-room-delete"
                      title="Usun pokoj"
                      onClick={(e) => {
                        e.preventDefault()
                        if (window.confirm(`Czy na pewno chcesz usunac pokoj "${ownedRoom.name || 'Pokoj prywatny'}"?`)) {
                          onDeleteRoom(ownedRoom.id, ownedRoom.guestToken)
                        }
                      }}
                    >🗑</button>
                  </div>
                ))
              ) : (
                <p className="home-rooms-empty">Nie masz jeszcze zadnych pokojow</p>
              )
            ) : (
              <p className="home-rooms-empty">Zaloguj sie, aby zobaczyc swoje pokoje</p>
            )}
          </div>
          <button className="homepage-btn homepage-btn--primary" onClick={onCreateRoom} disabled={creatingRoom}>
            <span className="homepage-btn-icon">✦</span>
            {creatingRoom ? 'Tworzenie...' : 'Utworz nowy pokoj'}
          </button>
        </div>

        <div className="homepage-col">
          <p className="home-col-title">Dolacz do pokoju</p>
          <div className="homepage-join">
            <input
              className="homepage-join-input"
              type="text"
              placeholder="Wklej link, token albo ID pokoju..."
              value={roomInput}
              onChange={e => setRoomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className="homepage-btn homepage-btn--secondary"
              onClick={handleJoin}
              disabled={!roomInput.trim()}
            >
              Dolacz
            </button>
          </div>
        </div>

        <div className="homepage-col">
          <p className="home-col-title">Ostatnie listy</p>
          {import.meta.env.DEV && (
            <button className="home-seed-btn" onClick={handleSeed} disabled={seeding}>
              {seeding ? 'Tworzenie...' : '+ Wygeneruj przykladowe listy'}
            </button>
          )}
          <div className="home-rooms-list">
            {isLoggedIn ? (
              latestForeignRooms.length > 0 ? (
                latestForeignRooms.map((recentRoom) => {
                  const ratingsArr = Object.values(recentRoom.ratings ?? {})
                  const avgRating = ratingsArr.length > 0
                    ? (ratingsArr.reduce((s, v) => s + v, 0) / ratingsArr.length).toFixed(1)
                    : null
                  return (
                    <a
                      key={recentRoom.id}
                      className={`home-room-card${recentRoom.isPlaying ? ' home-room-card--playing' : ''}`}
                      href={`/?room=${recentRoom.id}&view=1`}
                    >
                      <div className="home-room-card-link">
                        <span className="home-room-icon">♫</span>
                        <span className="home-room-label">{recentRoom.name || 'Lista'}</span>
                        <span className="home-room-status">Podejrzyj</span>
                      </div>
                      <div className="home-room-stats">
                        {avgRating !== null && <span>★ {avgRating} ({ratingsArr.length})</span>}
                        <span>{recentRoom.totalPlays ?? 0} odtw.</span>
                        <span>{recentRoom.totalVotes ?? 0} gł.</span>
                        <span>{recentRoom.songs?.length ?? 0} ut.</span>
                      </div>
                    </a>
                  )
                })
              ) : (
                <p className="home-rooms-empty">Brak list do pokazania</p>
              )
            ) : (
              <p className="home-rooms-empty">Zaloguj sie, aby zobaczyc ostatnie listy</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const initialUiState = {
  newSongUrl: '',
  newSongTitle: '',
  urlErr: '',
  fetchingTitle: false,
  ytPlaylistId: null,
  importingYtPlaylist: false,
  editingId: null,
  editingName: '',
  copied: null,
  collapsed: { settings: true, songs: false, suggestions: false },
  uiError: '',
}

function uiReducer(state, action) {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value }
    case 'toggleField':
      return { ...state, [action.field]: !state[action.field] }
    case 'toggleSection': {
      const isCurrentlyOpen = !state.collapsed[action.key]
      const allClosed = { settings: true, songs: true, suggestions: true }
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
  const [panelOpen, setPanelOpen] = useState({ qr: true, voting: false, showQueue: true })
  const [leftPanel, setLeftPanel] = useState('songs')
  const [hasRoomParam] = useState(() => !!new URLSearchParams(window.location.search).get('room'))
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [copyingRoom, setCopyingRoom] = useState(false)
  const [localCurrentSongId, setLocalCurrentSongId] = useState(null)
  const { user, roomId, roomType, isOwner, canEditRoom, isViewMode, authReady, roomError, signInWithGoogle, signOutUser } = useRoomAuth()
  const { room, suggestions } = useRoomSubscriptions(roomId)

  const homepageEnabled = !hasRoomParam && !!user && !user.isAnonymous
  const ownedRooms = useOwnedRooms(user?.uid, homepageEnabled)
  const latestForeignRooms = useLatestForeignRooms(user?.uid, homepageEnabled)

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

  const toggleLeftPanel = useCallback((panel) => {
    setLeftPanel((current) => current === panel ? null : panel)
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

  const renameRoom = useCallback(async (name) => {
    if (!roomId || !canEditRoom) return
    await executeAction(() => setMainState(roomId, { name }), 'Nie udalo sie zmienic nazwy pokoju.')
  }, [canEditRoom, executeAction, roomId])

  const handleDeleteRoom = useCallback(async (roomId, guestToken) => {
    await deleteRoom(roomId, guestToken)
  }, [])

  const handleCreateRoom = useCallback(async () => {
    if (!user) return
    setCreatingRoom(true)

    const ref = user.isAnonymous
      ? await executeAction(() => createPublicRoom('Nowy pokoj publiczny', user.uid), 'Nie udalo sie utworzyc pokoju publicznego.')
      : await executeAction(() => createPrivateRoom(user.uid, 'Nowy pokoj prywatny'), 'Nie udalo sie utworzyc pokoju prywatnego.')

    setCreatingRoom(false)
    if (ref?.id) {
      window.location.href = `/?room=${ref.id}`
    }
  }, [executeAction, user])

  const handleCopyRoom = useCallback(async () => {
    if (!user || user.isAnonymous || !room || canEditRoom) return
    setCopyingRoom(true)
    const ref = await executeAction(
      () => createPrivateRoomCopy(user.uid, room),
      'Nie udalo sie skopiowac pokoju.'
    )
    setCopyingRoom(false)
    if (ref?.id) {
      window.location.href = `/?room=${ref.id}`
    }
  }, [canEditRoom, executeAction, room, user])

  const settings = room?.settings ?? {}
  const isVisible = settings.isVisible !== false
  const playback = useJukeboxPlayback({
    authReady,
    canEditRoom,
    roomId,
    room,
    settings,
  })

  const {
    playerDivRef,
    playerRef,
    playerReady,
    ytPlayerState,
    loadProgress,
    remaining,
    playSongNow,
    queueSong,
    removeFromQueue,
    removeVotingOption,
    advanceToWinner,
    advanceToOption,
    resizeVotingOptions,
    startJukebox,
    stopJukebox,
    voteMode,
  } = playback

  const handleLocalPlay = useCallback((song) => {
    playerRef.current?.loadVideoById(song.ytId)
    setLocalCurrentSongId(song.id)
  }, [playerRef])

  const isPlaying = room?.isPlaying ?? false
  const currentSong = room?.currentSong ?? null
  const queue = room?.queue ?? []
  const nextOptions = room?.nextOptions ?? {}
  const nextVotesData = room?.nextVotes ?? {}
  const nextOptionKeys = Object.keys(nextOptions).sort()
  const voteThreshold = settings?.voteThreshold ?? 1
  const skipThreshold = settings?.skipThreshold ?? 0
  const allowSuggestions = settings?.allowSuggestions ?? true
  const showThumbnails = settings?.showThumbnails ?? true
  const skipVoters = room?.skipVoters ?? {}
  const skipCount = Object.keys(skipVoters).length
  const userId = user?.uid ?? null
  const mySkipVote = userId ? (skipVoters[userId] ?? false) : false
  const showOwnerUI = !!user && !user.isAnonymous
  const myRating = (room?.ratings ?? {})[userId] ?? 0

  const saveSettings = useCallback(async (key, value) => {
    if (!roomId || !canEditRoom) return
    await executeAction(() => saveRoomSetting(roomId, key, value), 'Nie udalo sie zapisac ustawien.')
    if (key === 'queueSize') {
      await executeAction(() => resizeVotingOptions(value), 'Nie udalo sie zaktualizowac opcji glosowania.')
    }
  }, [canEditRoom, executeAction, resizeVotingOptions, roomId])

  const vote = useCallback(async (optionKey) => {
    if (!user || !roomId || !room) return
    const currentVote = (room.nextVotes ?? {})[user.uid]
    if (currentVote !== optionKey) {
      incrementRoomVotes(roomId).catch(() => {})
    }
    await executeAction(() => voteNextOption(roomId, user.uid, optionKey, currentVote), 'Nie udalo sie zapisac glosu.')
  }, [executeAction, room, roomId, user])

  const voteSkip = useCallback(async () => {
    if (!userId || !roomId || !isPlaying) return
    await executeAction(() => toggleSkipVote(roomId, userId, mySkipVote), 'Nie udalo sie zapisac glosu pominiecia.')
  }, [executeAction, isPlaying, mySkipVote, roomId, userId])

  const rateActivePlaylist = useCallback(async (score) => {
    if (!userId || !roomId) return
    await rateRoom(roomId, userId, score)
  }, [roomId, userId])

  const submitSuggestion = useCallback(async ({ title, ytId, url }) => {
    if (!roomId || !userId) return false
    const done = await executeAction(
      () => addSuggestion(roomId, userId, { title, ytId, url }),
      'Nie udalo sie wyslac propozycji.'
    )
    return done !== null
  }, [executeAction, roomId, userId])

  const approveSuggestion = useCallback(async (suggestion) => {
    if (!roomId || !room) return
    const song = { id: genId(), title: suggestion.title, ytId: suggestion.ytId, url: suggestion.url }
    await executeAction(async () => {
      await replaceRoomSongs(roomId, [...(room.songs ?? []), song])
      await deleteSuggestion(roomId, suggestion.id)
    }, 'Nie udalo sie zatwierdzic propozycji.')
  }, [executeAction, room, roomId])

  const rejectSuggestion = useCallback(async (suggestionId) => {
    if (!roomId) return
    await executeAction(() => deleteSuggestion(roomId, suggestionId), 'Nie udalo sie odrzucic propozycji.')
  }, [executeAction, roomId])

  const playlistActions = usePlaylistActions({
    roomId,
    room,
    editingName: uiState.editingName,
    executeAction,
    dispatch,
    genId,
  })

  const songActions = useSongActions({
    roomId,
    room,
    newSongUrl: uiState.newSongUrl,
    newSongTitle: uiState.newSongTitle,
    ytPlaylistId: uiState.ytPlaylistId,
    executeAction,
    dispatch,
    genId,
  })

  const shareLinks = useShareLinks({
    roomId,
    roomType,
    guestToken: room?.guestToken ?? null,
    onCopied: (value) => dispatch({ type: 'setCopied', value }),
  })

  const togglePanel = useCallback((key) => {
    setPanelOpen((current) => ({ ...current, [key]: !current[key] }))
  }, [])

  if (!authReady) return <div className="splash"><div className="splash-icon">🎵</div><p>Laczenie...</p></div>

  if (!hasRoomParam) {
    return (
      <HomePage
        onCreateRoom={handleCreateRoom}
        creatingRoom={creatingRoom}
        user={user}
        onSignIn={signInWithGoogle}
        onSignOut={signOutUser}
        ownedRooms={ownedRooms}
        latestForeignRooms={latestForeignRooms}
        onDeleteRoom={handleDeleteRoom}
      />
    )
  }

  if (roomError) {
    return <div className="splash"><div className="splash-icon">🎵</div><p>{roomError}</p></div>
  }

  if (!room) {
    return <div className="splash"><div className="splash-icon">🎵</div><p>Ladowanie pokoju...</p></div>
  }

  return (
    <div className="app">
      {uiState.uiError && <div className="error-banner">{uiState.uiError}</div>}
      <RoomHeader
        showOwnerUI={showOwnerUI}
        canEditRoom={canEditRoom}
        roomType={roomType}
        leftPanel={leftPanel}
        toggleLeftPanel={toggleLeftPanel}
        copied={uiState.copied}
        copyAdminLink={shareLinks.copyAdminLink}
        newSongUrl={uiState.newSongUrl}
        setNewSongUrl={handleSongUrlChange}
        handleUrlBlur={songActions.handleUrlBlur}
        addSong={songActions.addSong}
        newSongTitle={uiState.newSongTitle}
        fetchingTitle={uiState.fetchingTitle}
        urlErr={uiState.urlErr}
        room={room}
        user={user}
        signInWithGoogle={signInWithGoogle}
        signOutUser={signOutUser}
        copyRoom={handleCopyRoom}
        copyingRoom={copyingRoom}
      />

      <main className="main">
        {showOwnerUI && (
          <PlaylistSidebar
            leftPanel={leftPanel}
            showOwnerUI={showOwnerUI}
            canEditRoom={canEditRoom}
            roomType={roomType}
            collapsed={uiState.collapsed}
            toggleSection={toggleSection}
            voteMode={voteMode}
            skipThreshold={skipThreshold}
            saveSettings={saveSettings}
            isPlaying={isPlaying}
            room={room}
            editingId={uiState.editingId}
            editingName={uiState.editingName}
            startEditPlaylist={startEditPlaylist}
            cancelEditPlaylist={cancelEditPlaylist}
            setEditingName={(value) => setField('editingName', value)}
            saveEditPlaylist={playlistActions.saveEditPlaylist}
            startJukebox={startJukebox}
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
            queue={queue}
            voteThreshold={voteThreshold}
            queueSize={Math.max(1, settings?.queueSize ?? 1)}
            queueSong={queueSong}
            removeFromQueue={removeFromQueue}
            copyAdminLink={shareLinks.copyAdminLink}
            copied={uiState.copied}
            onRenameRoom={renameRoom}
            showQr={panelOpen.qr}
            showQueueOverlay={panelOpen.showQueue}
            onToggleQr={() => togglePanel('qr')}
            onToggleQueueOverlay={() => togglePanel('showQueue')}
            isVisible={isVisible}
            isViewMode={isViewMode}
            onLocalPlay={handleLocalPlay}
            localCurrentSongId={localCurrentSongId}
          />
        )}

        <div className={`player-area${showOwnerUI ? ' player-area-admin' : ''}`}>
          {showOwnerUI ? (
            <>
              {panelOpen.showQueue && queue.length > 0 && (
                <div className="queue-overlay">
                  {queue.map((song) => (
                    <div key={song.id} className="queue-overlay-item">
                      <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-overlay-thumb" />
                      <ScrollText className="queue-overlay-title">{song.title}</ScrollText>
                    </div>
                  ))}
                </div>
              )}
              <div className="admin-scroll-area">
                {isViewMode && (
                  <div className="view-mode-banner">
                    <span className="view-mode-label">Tryb podgladu — lista tylko do odczytu</span>
                    <button
                      className="view-mode-copy-btn"
                      onClick={handleCopyRoom}
                      disabled={copyingRoom || !user || user.isAnonymous}
                    >
                      {copyingRoom ? 'Kopiowanie...' : 'Skopiuj te liste do siebie'}
                    </button>
                    {(!user || user.isAnonymous) && (
                      <span className="view-mode-hint">Zaloguj sie przez Google, aby skopiowac liste</span>
                    )}
                  </div>
                )}
                <div className="admin-top-row">
                  <NowPlayingPanel
                    isPlaying={isPlaying}
                    currentSong={currentSong}
                    remaining={remaining}
                    ytPlayerState={ytPlayerState}
                    loadProgress={loadProgress}
                    playerRef={playerRef}
                    playerDivRef={playerDivRef}
                    playerReady={playerReady}
                    advanceToWinner={advanceToWinner}
                    skipThreshold={skipThreshold}
                    skipCount={skipCount}
                    startJukebox={startJukebox}
                    stopJukebox={stopJukebox}
                    room={room}
                    canEditRoom={canEditRoom}
                  />
                  {shareLinks.voterUrl && panelOpen.qr && (
                    <div className="admin-qr-panel">
                      <div className="qr-clickable" onClick={shareLinks.copyVoterLink} title="Kliknij aby skopiowac link">
                        <QRCodeSVG value={shareLinks.voterUrl} size={150} bgColor="#000000" fgColor="#ffffff" />
                        {uiState.copied === 'voter' && <div className="qr-copied-overlay">✓ Skopiowano</div>}
                      </div>
                      <p className="qr-hint">Kliknij QR, aby skopiowac link</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="voting-panel-bottom">
                <div className="voting-bottom-bar" onClick={() => togglePanel('voting')}>
                  {isPlaying && nextOptionKeys.length > 0 ? (() => {
                    const counts = nextOptionKeys.map(k => Object.values(nextVotesData).filter(v => v === k).length)
                    const total = Object.values(nextVotesData).length
                    const maxCount = Math.max(0, ...counts)
                    return nextOptionKeys.map((k, i) => {
                      const count = counts[i]
                      const pct = total > 0 ? Math.round(count / total * 100) : 0
                      const isWinning = count > 0 && count === maxCount
                      return (
                        <div key={k} className={`voting-bar-opt${isWinning ? ' winning' : ''}`}>
                          <div className="vbo-fill" style={{ height: `${pct}%` }} />
                          <span className="vbo-num">{count}</span>
                          <span className="vbo-pct">{pct}%</span>
                        </div>
                      )
                    })
                  })() : (
                    <h2 className="section-title" style={{ flex: 1, padding: '0 1rem' }}>Glosowanie</h2>
                  )}
                  <span className="section-arrow" style={{ padding: '0 1rem' }}>{panelOpen.voting ? '▼' : '▲'}</span>
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
                        onQueueSong={queueSong}
                        onRemoveOption={removeVotingOption}
                        columns
                        onChooseOption={advanceToOption}
                        showThumbnails={showThumbnails}
                      />
                    )}
                    <div className="queue-size-row">
                      <span className="queue-size-label">Utworow w grupie:</span>
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
              jukeboxState={room}
            />
          )}
        </div>
      </main>
    </div>
  )
}
