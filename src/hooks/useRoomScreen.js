import { useCallback, useEffect, useReducer, useState } from 'react'
import { seedSampleRooms } from '../dev/seedRooms'
import { genId } from '../lib/jukebox'
import {
  addSuggestion,
  createContactMessage,
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
  toggleSkipVote,
  voteNextOption,
} from '../services/jukeboxService'
import { useJukeboxPlayback } from './useJukeboxPlayback'
import { useLatestForeignRooms, useOwnedRooms } from './useRoomListings'
import { usePlaylistActions } from './usePlaylistActions'
import { useRoomAuth } from './useRoomAuth'
import { useRoomSubscriptions } from './useRoomSubscriptions'
import { useShareLinks } from './useShareLinks'
import { useSongActions } from './useSongActions'

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
    default:
      return state
  }
}

function resolveRoomInput(input) {
  const rawInput = input.trim()
  if (!rawInput) return null

  try {
    const parsedUrl = new URL(rawInput)
    return parsedUrl.searchParams.get('room')?.trim()
      || parsedUrl.pathname.replace(/^\/+|\/+$/g, '')
      || rawInput
  } catch {
    return rawInput
  }
}

export function useRoomScreen(route) {
  const [uiState, dispatch] = useReducer(uiReducer, initialUiState)
  const [panelOpen, setPanelOpen] = useState({ qr: true, voting: false, showQueue: true, showRoomCode: false })
  const [leftPanel, setLeftPanel] = useState('songs')
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [copyingRoom, setCopyingRoom] = useState(false)
  const [appendingRoom, setAppendingRoom] = useState(false)
  const [localCurrentSongId, setLocalCurrentSongId] = useState(null)

  const auth = useRoomAuth(route.roomParam)
  const canEditRoom = route.isViewMode ? auth.isOwner : auth.canEditRoom
  const { room, suggestions } = useRoomSubscriptions(auth.roomId)

  const isLoggedIn = !!auth.user && !auth.user.isAnonymous
  const homepageEnabled = !route.hasRoomParam && isLoggedIn
  const ownedRooms = useOwnedRooms(auth.user?.uid, isLoggedIn)
  const latestForeignRooms = useLatestForeignRooms(auth.user?.uid, homepageEnabled)

  useEffect(() => {
    if (!uiState.copied) return
    const timeoutId = setTimeout(() => {
      dispatch({ type: 'setField', field: 'copied', value: null })
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
    dispatch({ type: 'setField', field: 'uiError', value: '' })
    try {
      return await action()
    } catch (error) {
      console.error(error)
      dispatch({ type: 'setField', field: 'uiError', value: errorMessage })
      return null
    }
  }, [])

  const renameRoom = useCallback(async (name) => {
    if (!auth.roomId || !canEditRoom) return
    await executeAction(() => setMainState(auth.roomId, { name }), 'Nie udalo sie zmienic nazwy szafy.')
  }, [auth.roomId, canEditRoom, executeAction])

  const handleDeleteRoom = useCallback(async (targetRoom) => {
    const roomName = targetRoom?.name || 'Szafa prywatna'
    if (!targetRoom?.id || !window.confirm(`Czy na pewno chcesz usunac szafe "${roomName}"?`)) return

    await executeAction(
      () => deleteRoom(targetRoom.id, targetRoom.guestToken),
      'Nie udalo sie usunac szafy.'
    )
  }, [executeAction])

  const handleCreateRoom = useCallback(async () => {
    if (!auth.user) return
    setCreatingRoom(true)

    const ref = auth.user.isAnonymous
      ? await executeAction(() => createPublicRoom('Nowa szafa publiczna', auth.user.uid), 'Nie udalo sie utworzyc szafy publicznej.')
      : await executeAction(() => createPrivateRoom(auth.user.uid, 'Nowa szafa prywatna'), 'Nie udalo sie utworzyc szafy prywatnej.')

    setCreatingRoom(false)
    if (ref?.id) route.navigateToRoom(ref.id)
  }, [auth.user, executeAction, route])

  const handleCopyRoom = useCallback(async () => {
    if (!auth.user || auth.user.isAnonymous || !room || canEditRoom) return
    setCopyingRoom(true)
    const ref = await executeAction(
      () => createPrivateRoomCopy(auth.user.uid, room),
      'Nie udalo sie skopiowac szafy.'
    )
    setCopyingRoom(false)
    if (ref?.id) route.navigateToRoom(ref.id)
  }, [auth.user, canEditRoom, executeAction, room, route])

  const handleAppendToRoom = useCallback(async (targetRoomId) => {
    const targetRoom = ownedRooms.find((r) => r.id === targetRoomId)
    if (!targetRoom || !room) return
    setAppendingRoom(true)
    const existingYtIds = new Set((targetRoom.songs ?? []).map((s) => s.ytId))
    const newSongs = (room.songs ?? []).filter((s) => !existingYtIds.has(s.ytId))
    const merged = [...(targetRoom.songs ?? []), ...newSongs]
    await executeAction(() => replaceRoomSongs(targetRoomId, merged), 'Nie udało się dołączyć piosenek.')
    setAppendingRoom(false)
  }, [executeAction, ownedRooms, room])

  const handleJoinRoom = useCallback((input) => {
    const roomValue = resolveRoomInput(input)
    if (roomValue) route.navigateToRoom(roomValue)
  }, [route])

  const handleSeedRooms = useCallback(async () => {
    if (!window.confirm('Utworzyc 5 przykladowych list w bazie danych?')) return
    try {
      await seedSampleRooms()
      alert('Gotowe! Odswiez strone, aby zobaczyc listy.')
    } catch (error) {
      alert(`Blad: ${error.message}`)
    }
  }, [])

  const settings = room?.settings ?? {}
  const playback = useJukeboxPlayback({
    authReady: auth.authReady,
    canEditRoom,
    isViewMode: route.isViewMode,
    roomId: auth.roomId,
    room,
    settings,
  })

  const handleLocalPlay = useCallback((song) => {
    playback.playerRef.current?.loadVideoById(song.ytId)
    setLocalCurrentSongId(song.id)
  }, [playback.playerRef])

  const isPlaying = room?.isPlaying ?? false
  const currentSong = room?.currentSong ?? null
  const queue = room?.queue ?? []
  const nextOptions = room?.nextOptions ?? {}
  const nextVotesData = room?.nextVotes ?? {}
  const nextOptionKeys = Object.keys(nextOptions).sort()
  const voteThreshold = settings.voteThreshold ?? 1
  const skipThreshold = settings.skipThreshold ?? 0
  const showThumbnails = settings.showThumbnails ?? true
  const skipCount = Object.keys(room?.skipVoters ?? {}).length
  const userId = auth.user?.uid ?? null
  const mySkipVote = userId ? ((room?.skipVoters ?? {})[userId] ?? false) : false
  const showOwnerUI = !!auth.user && !auth.user.isAnonymous
  const myRating = (room?.ratings ?? {})[userId] ?? 0

  const saveSettings = useCallback(async (key, value) => {
    if (!auth.roomId || !canEditRoom) return
    await executeAction(() => saveRoomSetting(auth.roomId, key, value), 'Nie udalo sie zapisac ustawien.')
    if (key === 'queueSize') {
      await executeAction(() => playback.resizeVotingOptions(value), 'Nie udalo sie zaktualizowac opcji glosowania.')
    }
  }, [auth.roomId, canEditRoom, executeAction, playback])

  const vote = useCallback(async (optionKey) => {
    if (!auth.user || !auth.roomId || !room) return
    const currentVote = (room.nextVotes ?? {})[auth.user.uid]
    if (currentVote !== optionKey) incrementRoomVotes(auth.roomId).catch(() => {})
    await executeAction(() => voteNextOption(auth.roomId, auth.user.uid, optionKey, currentVote), 'Nie udalo sie zapisac glosu.')
  }, [auth.roomId, auth.user, executeAction, room])

  const voteSkip = useCallback(async () => {
    if (!userId || !auth.roomId || !isPlaying) return
    await executeAction(() => toggleSkipVote(auth.roomId, userId, mySkipVote), 'Nie udalo sie zapisac glosu pominiecia.')
  }, [auth.roomId, executeAction, isPlaying, mySkipVote, userId])

  const rateActivePlaylist = useCallback(async (score) => {
    if (!userId || !auth.roomId) return
    await rateRoom(auth.roomId, userId, score)
  }, [auth.roomId, userId])

  const submitSuggestion = useCallback(async ({ title, ytId, url }) => {
    if (!auth.roomId || !userId) return false
    const done = await executeAction(
      () => addSuggestion(auth.roomId, userId, { title, ytId, url }),
      'Nie udalo sie wyslac propozycji.'
    )
    return done !== null
  }, [auth.roomId, executeAction, userId])

  const submitContactMessage = useCallback(async ({
    message,
    authorName,
    authorEmail,
    source,
    roomId = null,
  }) => {
    try {
      await createContactMessage({
        message,
        authorName,
        authorEmail,
        source,
        roomId,
        userId,
      })
      return true
    } catch (error) {
      throw new Error(error?.message || 'Nie udalo sie wyslac wiadomosci.')
    }
  }, [userId])

  const approveSuggestion = useCallback(async (suggestion) => {
    if (!auth.roomId || !room) return
    const song = { id: genId(), title: suggestion.title, ytId: suggestion.ytId, url: suggestion.url }
    await executeAction(async () => {
      await replaceRoomSongs(auth.roomId, [...(room.songs ?? []), song])
      await deleteSuggestion(auth.roomId, suggestion.id)
    }, 'Nie udalo sie zatwierdzic propozycji.')
  }, [auth.roomId, executeAction, room])

  const rejectSuggestion = useCallback(async (suggestionId) => {
    if (!auth.roomId) return
    await executeAction(() => deleteSuggestion(auth.roomId, suggestionId), 'Nie udalo sie odrzucic propozycji.')
  }, [auth.roomId, executeAction])

  const playlistActions = usePlaylistActions({
    roomId: auth.roomId,
    room,
    editingName: uiState.editingName,
    executeAction,
    dispatch,
    genId,
  })

  const songActions = useSongActions({
    roomId: auth.roomId,
    room,
    newSongUrl: uiState.newSongUrl,
    newSongTitle: uiState.newSongTitle,
    ytPlaylistId: uiState.ytPlaylistId,
    executeAction,
    dispatch,
    genId,
  })

  const shareLinks = useShareLinks({
    roomId: auth.roomId,
    roomType: auth.roomType,
    guestToken: room?.guestToken ?? null,
    buildRoomUrl: route.buildRoomUrl,
    fallbackGuestUrl: route.currentUrl,
    onCopied: (value) => dispatch({ type: 'setField', field: 'copied', value }),
  })

  const togglePanel = useCallback((key) => {
    setPanelOpen((current) => ({ ...current, [key]: !current[key] }))
  }, [])

  return {
    auth,
    room,
    roomError: auth.roomError,
    authReady: auth.authReady,
    canEditRoom,
    showOwnerUI,
    userId,
    currentSong,
    isPlaying,
    queue,
    nextOptionKeys,
    nextOptions,
    nextVotesData,
    voteThreshold,
    skipThreshold,
    showThumbnails,
    skipCount,
    mySkipVote,
    myRating,
    settings,
    suggestions,
    ownedRooms,
    latestForeignRooms,
    shareLinks,
    uiState,
    leftPanel,
    panelOpen,
    creatingRoom,
    copyingRoom,
    appendingRoom,
    localCurrentSongId,
    setField,
    toggleSection,
    toggleLeftPanel,
    startEditPlaylist,
    cancelEditPlaylist,
    handleSongUrlChange,
    handleCreateRoom,
    handleCopyRoom,
    handleAppendToRoom,
    handleDeleteRoom,
    handleJoinRoom,
    handleLocalPlay,
    handleSeedRooms,
    renameRoom,
    saveSettings,
    vote,
    voteSkip,
    rateActivePlaylist,
    submitSuggestion,
    submitContactMessage,
    approveSuggestion,
    rejectSuggestion,
    playlistActions,
    songActions,
    togglePanel,
    isVisible: settings.isVisible !== false,
    voteMode: playback.voteMode,
    playerRef: playback.playerRef,
    playerDivRef: playback.playerDivRef,
    playerReady: playback.playerReady,
    ytPlayerState: playback.ytPlayerState,
    loadProgress: playback.loadProgress,
    remaining: playback.remaining,
    playSongNow: playback.playSongNow,
    queueSong: playback.queueSong,
    removeFromQueue: playback.removeFromQueue,
    removeVotingOption: playback.removeVotingOption,
    advanceToWinner: playback.advanceToWinner,
    advanceToOption: playback.advanceToOption,
    startJukebox: playback.startJukebox,
    stopJukebox: playback.stopJukebox,
  }
}
