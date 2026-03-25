import {
  useRoomLifecycleCommands,
  useRoomSettingsCommands,
  useRoomSuggestionCommands,
  useRoomVotingCommands,
} from './useRoomCommandGroups'

export function useRoomCommands({
  auth,
  canEditRoom,
  room,
  suggestions,
  ownedRooms,
  route,
  executeAction,
  dispatch,
  userId,
  isPlaying,
  mySkipVote,
  resizeVotingOptions,
  setCreatingRoom,
  setCopyingRoom,
  setAppendingRoom,
}) {
  const lifecycleCommands = useRoomLifecycleCommands({
    auth,
    canEditRoom,
    room,
    ownedRooms,
    route,
    executeAction,
    setCreatingRoom,
    setCopyingRoom,
    setAppendingRoom,
  })

  const settingsCommands = useRoomSettingsCommands({
    auth,
    canEditRoom,
    executeAction,
    resizeVotingOptions,
    roomGuestToken: room?.guestToken ?? null,
    roomType: room?.type,
  })

  const votingCommands = useRoomVotingCommands({
    auth,
    canEditRoom,
    room,
    executeAction,
    userId,
    isPlaying,
    mySkipVote,
  })

  const suggestionCommands = useRoomSuggestionCommands({
    auth,
    room,
    suggestions,
    canEditRoom,
    executeAction,
    dispatch,
    userId,
  })

  return {
    ...lifecycleCommands,
    ...settingsCommands,
    ...votingCommands,
    ...suggestionCommands,
  }
}
