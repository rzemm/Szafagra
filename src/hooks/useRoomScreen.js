import { useCallback } from 'react'
import { genId } from '../lib/jukebox'
import { useJukeboxPlayback } from './useJukeboxPlayback'
import { useOwnedRooms, useUpcomingOpenParties, useTopRatedRooms } from './useRoomListings'
import { usePlaylistActions } from './usePlaylistActions'
import { useRoomAuth } from './useRoomAuth'
import { useRoomCommands } from './useRoomCommands'
import { useRoomSubscriptions } from './useRoomSubscriptions'
import { useRoomUiState } from './useRoomUiState'
import { useShareLinks } from './useShareLinks'
import { useSongActions } from './useSongActions'

function buildHomeScreen({
  auth,
  ownedRooms,
  upcomingOpenParties,
  topRatedRooms,
  commands,
  ui,
}) {
  return {
    creatingRoom: ui.creatingRoom,
    user: auth.user,
    ownedRooms,
    upcomingOpenParties,
    topRatedRooms,
    onCreateRoom: commands.handleCreateRoom,
    onDeleteRoom: commands.handleDeleteRoom,
    onJoinRoom: commands.handleJoinRoom,
    onSeedRooms: commands.handleSeedRooms,
    onSignIn: auth.signInWithGoogle,
    onSignOut: auth.signOutUser,
    onUpdateDisplayName: auth.updateDisplayName,
    onCreateRoomFromYt: commands.handleCreateRoomFromYt,
    onAddYtToRoom: commands.handleAddYtToRoom,
    onCopyForeignRoom: (sourceRoom) => commands.handleCreateRoomFromYt(sourceRoom.name || 'Kopia', sourceRoom.songs ?? []),
    onAppendForeignToRoom: commands.handleAddYtToRoom,
    onSubmitMessage: commands.submitContactMessage,
  }
}

function buildHeaderModel({
  auth,
  ownedRooms,
  room,
  showOwnerUI,
  leftPanel,
  toggleLeftPanel,
  shareLinks,
  copied,
  suggestions,
  commands,
}) {
  return {
    showOwnerUI,
    leftPanel,
    toggleLeftPanel,
    user: auth.user,
    signInWithGoogle: auth.signInWithGoogle,
    signOutUser: auth.signOutUser,
    updateDisplayName: auth.updateDisplayName,
    onCreateRoomFromYt: commands.handleCreateRoomFromYt,
    onAddYtToRoom: commands.handleAddYtToRoom,
    currentRoomId: auth.roomId,
    ownedRooms,
    onShareGuestLink: shareLinks.copyVoterLink,
    guestCopied: copied === 'voter',
    proposalsCount: Object.keys(room?.votingProposals ?? {}).length + (suggestions?.length ?? 0),
  }
}

function buildOwnerViewModel({
  room,
  canEditRoom,
  roomMode,
  route,
  ownedRooms,
  settings,
  suggestions,
  shareLinks,
  ui,
  playback,
  playbackState,
  votingState,
  commands,
  playlistActions,
  songActions,
  handleLocalPlay,
}) {
  return {
    room,
    canEditRoom,
    roomMode,
    ui: {
      leftPanel: ui.leftPanel,
      panelOpen: ui.panelOpen,
      togglePanel: ui.togglePanel,
      toggleLeftPanel: ui.toggleLeftPanel,
    },
    sidebar: {
      saveSettings: commands.saveSettings,
      suggestions,
      showThumbnails: playbackState.showThumbnails,
      showAddedBy: settings.showAddedBy ?? false,
      playlistActions,
      songActions,
      settings,
      renameRoom: commands.renameRoom,
      changeRoomCode: commands.changeRoomCode,
      isVisible: settings.isVisible !== false,
      ownedRooms,
      onCreateRoomFromYt: commands.handleCreateRoomFromYt,
      onAddYtToRoom: commands.handleAddYtToRoom,
      approveSuggestion: commands.approveSuggestion,
      rejectSuggestion: commands.rejectSuggestion,
      removeVotingProposal: commands.removeVotingProposal,
      onSubmitMessage: commands.submitContactMessage,
      newSongUrl: ui.uiState.newSongUrl,
      handleSongUrlChange: ui.handleSongUrlChange,
      handleUrlBlur: songActions.handleUrlBlur,
      addSong: songActions.addSong,
      songSearchSuggestions: songActions.suggestions,
      selectSuggestion: songActions.selectSuggestion,
      clearSuggestions: songActions.clearSuggestions,
      newSongTitle: ui.uiState.newSongTitle,
      fetchingTitle: ui.uiState.fetchingTitle,
      urlErr: ui.uiState.urlErr,
    },
    playback: {
      isPlaying: playbackState.isPlaying,
      currentSong: playbackState.currentSong,
      remaining: playback.remaining,
      ytPlayerState: playback.ytPlayerState,
      loadProgress: playback.loadProgress,
      playerRef: playback.playerRef,
      playerDivRef: playback.playerDivRef,
      playerReady: playback.playerReady,
      advanceToWinner: playback.advanceToWinner,
      skipThreshold: playbackState.skipThreshold,
      skipCount: playbackState.skipCount,
      startJukebox: playback.startJukebox,
      stopJukebox: playback.stopJukebox,
      queue: playbackState.queue,
      removeFromQueue: playback.removeFromQueue,
    },
    voting: {
      voteMode: playback.voteMode,
      voteThreshold: playbackState.voteThreshold,
      nextOptionKeys: votingState.nextOptionKeys,
      nextOptions: votingState.nextOptions,
      nextVotesData: votingState.nextVotesData,
      playSongNow: playback.playSongNow,
      queueSong: playback.queueSong,
      replaceSong: playback.replaceSong,
      removeVotingOption: playback.removeVotingOption,
      advanceToOption: playback.advanceToOption,
    },
    sharing: {
      shareLinks,
      copied: ui.uiState.copied,
    },
    viewMode: {
      isViewMode: route.isViewMode,
      handleCopyRoom: commands.handleCopyRoom,
      copyingRoom: ui.copyingRoom,
      handleAppendToRoom: commands.handleAppendToRoom,
      appendingRoom: ui.appendingRoom,
      ownedRooms,
      localCurrentSongId: ui.localCurrentSongId,
      handleLocalPlay,
    },
  }
}

function buildGuestViewModel({
  auth,
  room,
  settings,
  playback,
  playbackState,
  votingState,
  commands,
  onOpenCookieSettings,
}) {
  return {
    isOwner: auth.isOwner,
    playerDivRef: playback.playerDivRef,
    isPlaying: playbackState.isPlaying,
    currentSong: playbackState.currentSong,
    remaining: playback.remaining,
    queue: playbackState.queue,
    nextOptionKeys: votingState.nextOptionKeys,
    nextOptions: votingState.nextOptions,
    nextVotesData: votingState.nextVotesData,
    userId: playbackState.userId,
    vote: commands.vote,
    skipThreshold: playbackState.skipThreshold,
    mySkipVote: playbackState.mySkipVote,
    voteSkip: commands.voteSkip,
    allowSuggestions: settings.allowSuggestions ?? true,
    allowSuggestFromList: settings.allowSuggestFromList ?? false,
    allowGuestListening: settings.allowGuestListening ?? false,
    tickerText: settings.tickerText ?? '',
    tickerForGuests: settings.tickerForGuests ?? false,
    submitSuggestion: commands.submitSuggestion,
    submitVotingProposal: commands.submitVotingProposal,
    submitPlaylistSuggestion: commands.submitPlaylistSuggestion,
    myRating: playbackState.myRating,
    onRate: commands.rateActivePlaylist,
    showThumbnails: playbackState.showThumbnails,
    jukeboxState: room,
    onSubmitMessage: commands.submitContactMessage,
    onOpenCookieSettings,
  }
}

export function useRoomScreen(route) {
  const ui = useRoomUiState()
  const auth = useRoomAuth(route.roomParam)
  const canEditRoom = route.isViewMode ? auth.isOwner : auth.canEditRoom
  const { room, suggestions } = useRoomSubscriptions(auth.roomId)

  const isLoggedIn = !!auth.user && !auth.user.isAnonymous
  const onHomepage = !route.hasRoomParam
  const ownedRooms = useOwnedRooms(auth.user?.uid, isLoggedIn)
  const upcomingOpenParties = useUpcomingOpenParties(onHomepage)
  const topRatedRooms = useTopRatedRooms(onHomepage)

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

  const playbackState = {
    isPlaying: room?.isPlaying ?? false,
    currentSong: room?.currentSong ?? null,
    queue: room?.queue ?? [],
    voteThreshold: settings.voteThreshold ?? 1,
    skipThreshold: settings.skipThreshold ?? 0,
    showThumbnails: settings.showThumbnails ?? true,
    skipCount: Object.keys(room?.skipVoters ?? {}).length,
    userId: auth.user?.uid ?? null,
    mySkipVote: auth.user?.uid ? ((room?.skipVoters ?? {})[auth.user.uid] ?? false) : false,
    myRating: (room?.ratings ?? {})[auth.user?.uid ?? null] ?? 0,
  }

  const votingState = {
    nextOptions: room?.nextOptions ?? {},
    nextVotesData: room?.nextVotes ?? {},
  }
  votingState.nextOptionKeys = Object.keys(votingState.nextOptions).sort()

  const roomMode = settings.roomMode ?? 'party_prep'
  const showOwnerUI = (() => {
    if (!auth.user) return false
    if (roomMode === 'party_prep') return true
    if (roomMode === 'party') return auth.isOwner && !auth.isGuestLink
    if (roomMode === 'player') return auth.isOwner && !auth.isGuestLink
    return !auth.user.isAnonymous
  })()

  const commands = useRoomCommands({
    auth,
    canEditRoom,
    room,
    ownedRooms,
    route,
    executeAction,
    dispatch: ui.dispatch,
    userId: playbackState.userId,
    isPlaying: playbackState.isPlaying,
    mySkipVote: playbackState.mySkipVote,
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
    routeState: {
      hasRoomParam: route.hasRoomParam,
      isViewMode: route.isViewMode,
      navigateToRoom: route.navigateToRoom,
    },
    usernamePrompt: {
      needsUsername: auth.needsUsername,
      confirmUsername: auth.confirmUsername,
    },
    homeScreen: buildHomeScreen({
      auth,
      ownedRooms,
      upcomingOpenParties,
      topRatedRooms,
      commands,
      ui,
    }),
    roomScreen: {
      room,
      roomError: auth.roomError,
      showOwnerUI,
      roomMode,
      uiError: ui.uiState.uiError,
      header: buildHeaderModel({
        auth,
        ownedRooms,
        room,
        showOwnerUI,
        leftPanel: ui.leftPanel,
        toggleLeftPanel: ui.toggleLeftPanel,
        shareLinks,
        copied: ui.uiState.copied,
        suggestions,
        commands,
      }),
      ownerView: buildOwnerViewModel({
        room,
        canEditRoom,
        roomMode,
        route,
        ownedRooms,
        settings,
        suggestions,
        shareLinks,
        ui,
        playback,
        playbackState,
        votingState,
        commands,
        playlistActions,
        songActions,
        handleLocalPlay,
      }),
      guestView: buildGuestViewModel({
        auth,
        room,
        settings,
        playback,
        playbackState,
        votingState,
        commands,
        onOpenCookieSettings: null,
      }),
    },
  }
}
