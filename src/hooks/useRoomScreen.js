import { useCallback } from 'react'
import { genId } from '../lib/jukebox'
import { useJukeboxPlayback } from './useJukeboxPlayback'
import { useGuestVisitedRooms, useOwnedRooms, useUpcomingOpenParties, useTopRatedRooms } from './useRoomListings'
import { usePlaylistActions } from './usePlaylistActions'
import { useRoomAuth } from './useRoomAuth'
import { useRoomCommands } from './useRoomCommands'
import { useRoomSubscriptions } from './useRoomSubscriptions'
import { useRoomUiState } from './useRoomUiState'
import { useShareLinks } from './useShareLinks'
import { useSongActions } from './useSongActions'
import {
  buildGuestScreenModel,
  buildHomeScreen,
  buildOwnerScreenModel,
  buildRoomHeaderModel,
} from './useRoomScreenModels'

function buildPlaybackState({ room, settings, auth }) {
  return {
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
}

function buildVotingState(room) {
  const nextOptions = room?.nextOptions ?? {}
  return {
    nextOptions,
    nextVotesData: room?.nextVotes ?? {},
    nextOptionKeys: Object.keys(nextOptions).sort(),
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
  const guestVisitedRooms = useGuestVisitedRooms(auth.user?.uid, isLoggedIn && onHomepage)

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

  const playbackState = buildPlaybackState({ room, settings, auth })
  const votingState = buildVotingState(room)
  const showOwnerUI = !!(auth.user && auth.isOwner && !auth.isGuestLink)

  const commands = useRoomCommands({
    auth,
    canEditRoom,
    room,
    suggestions,
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
      guestVisitedRooms,
      commands,
      ui,
    }),
    roomScreen: {
      room,
      roomError: auth.roomError,
      showOwnerUI,
      uiError: ui.uiState.uiError,
      header: buildRoomHeaderModel({
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
      ownerView: buildOwnerScreenModel({
        room,
        canEditRoom,
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
      guestView: buildGuestScreenModel({
        auth,
        room,
        settings,
        playback,
        playbackState,
        votingState,
        commands,
        onOpenCookieSettings: null,
        isLoggedIn,
      }),
    },
  }
}
