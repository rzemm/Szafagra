import { useCallback } from 'react'
import { genId } from '../lib/jukebox'
import { useJukeboxPlayback } from './useJukeboxPlayback'
import { useLatestForeignRooms, useOwnedRooms } from './useRoomListings'
import { usePlaylistActions } from './usePlaylistActions'
import { useRoomAuth } from './useRoomAuth'
import { useRoomCommands } from './useRoomCommands'
import { useRoomSubscriptions } from './useRoomSubscriptions'
import { useRoomUiState } from './useRoomUiState'
import { useShareLinks } from './useShareLinks'
import { useSongActions } from './useSongActions'

export function useRoomScreen(route) {
  const ui = useRoomUiState()
  const auth = useRoomAuth(route.roomParam)
  const canEditRoom = route.isViewMode ? auth.isOwner : auth.canEditRoom
  const { room, suggestions } = useRoomSubscriptions(auth.roomId)

  const isLoggedIn = !!auth.user && !auth.user.isAnonymous
  const homepageEnabled = !route.hasRoomParam && isLoggedIn
  const ownedRooms = useOwnedRooms(auth.user?.uid, isLoggedIn)
  const latestForeignRooms = useLatestForeignRooms(auth.user?.uid, homepageEnabled)

  const executeAction = useCallback(async (action, errorMessage) => {
    ui.dispatch({ type: 'setField', field: 'uiError', value: '' })
    try {
      return await action()
    } catch (error) {
      console.error(error)
      ui.dispatch({ type: 'setField', field: 'uiError', value: errorMessage })
      return null
    }
  }, [ui])

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
    ui.setLocalCurrentSongId(song.id)
  }, [playback.playerRef, ui])

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

  const commands = useRoomCommands({
    auth,
    canEditRoom,
    room,
    ownedRooms,
    route,
    executeAction,
    dispatch: ui.dispatch,
    userId,
    isPlaying,
    mySkipVote,
    resizeVotingOptions: playback.resizeVotingOptions,
    setCreatingRoom: ui.setCreatingRoom,
    setCopyingRoom: ui.setCopyingRoom,
    setAppendingRoom: ui.setAppendingRoom,
  })

  const playlistActions = usePlaylistActions({
    roomId: auth.roomId,
    room,
    editingName: ui.uiState.editingName,
    executeAction,
    dispatch: ui.dispatch,
    genId,
  })

  const songActions = useSongActions({
    roomId: auth.roomId,
    room,
    newSongUrl: ui.uiState.newSongUrl,
    newSongTitle: ui.uiState.newSongTitle,
    ytPlaylistId: ui.uiState.ytPlaylistId,
    executeAction,
    dispatch: ui.dispatch,
    genId,
    user: auth.user,
  })

  const shareLinks = useShareLinks({
    roomId: auth.roomId,
    roomType: auth.roomType,
    guestToken: room?.guestToken ?? null,
    buildRoomUrl: route.buildRoomUrl,
    fallbackGuestUrl: route.currentUrl,
    onCopied: (value) => ui.dispatch({ type: 'setField', field: 'copied', value }),
  })

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
    uiState: ui.uiState,
    leftPanel: ui.leftPanel,
    panelOpen: ui.panelOpen,
    creatingRoom: ui.creatingRoom,
    copyingRoom: ui.copyingRoom,
    appendingRoom: ui.appendingRoom,
    localCurrentSongId: ui.localCurrentSongId,
    setField: ui.setField,
    toggleSection: ui.toggleSection,
    toggleLeftPanel: ui.toggleLeftPanel,
    startEditPlaylist: ui.startEditPlaylist,
    cancelEditPlaylist: ui.cancelEditPlaylist,
    handleSongUrlChange: ui.handleSongUrlChange,
    handleCreateRoom: commands.handleCreateRoom,
    handleCreateRoomFromYt: commands.handleCreateRoomFromYt,
    handleAddYtToRoom: commands.handleAddYtToRoom,
    handleCopyRoom: commands.handleCopyRoom,
    handleAppendToRoom: commands.handleAppendToRoom,
    handleDeleteRoom: commands.handleDeleteRoom,
    handleJoinRoom: commands.handleJoinRoom,
    handleLocalPlay,
    handleSeedRooms: commands.handleSeedRooms,
    renameRoom: commands.renameRoom,
    saveSettings: commands.saveSettings,
    vote: commands.vote,
    voteSkip: commands.voteSkip,
    rateActivePlaylist: commands.rateActivePlaylist,
    submitSuggestion: commands.submitSuggestion,
    submitContactMessage: commands.submitContactMessage,
    approveSuggestion: commands.approveSuggestion,
    rejectSuggestion: commands.rejectSuggestion,
    playlistActions,
    songActions,
    togglePanel: ui.togglePanel,
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
    replaceSong: playback.replaceSong,
    removeVotingOption: playback.removeVotingOption,
    advanceToWinner: playback.advanceToWinner,
    advanceToOption: playback.advanceToOption,
    startJukebox: playback.startJukebox,
    stopJukebox: playback.stopJukebox,
  }
}
