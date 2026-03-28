import { useCallback } from 'react'
import { attachSongIds, createAddedBySuggestion, createSong } from '../domain/song'
import { genId } from '../lib/jukebox'
import {
  addSongToList,
  addSuggestion,
  changeRoomGuestToken,
  clearVotingProposals,
  createContactMessage,
  createPartyRoom,
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
  setVotingProposal,
  toggleSkipVote,
  voteNextOption,
} from '../services/jukeboxService'

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

function mergeUniqueSongs(existingSongs = [], incomingSongs = []) {
  const existingYtIds = new Set(existingSongs.map((song) => song.ytId))
  const newSongs = incomingSongs.filter((song) => !existingYtIds.has(song.ytId))
  return [...existingSongs, ...newSongs]
}

export function useRoomLifecycleCommands({
  auth,
  canEditRoom,
  room,
  ownedRooms,
  route,
  executeAction,
  setCreatingRoom,
  setCopyingRoom,
  setAppendingRoom,
}) {
  const renameRoom = useCallback(async (name) => {
    if (!auth.roomId || !canEditRoom) return
    await executeAction(() => setMainState(auth.roomId, { name }), 'Nie udało się zmienić nazwy szafy.')
  }, [auth.roomId, canEditRoom, executeAction])

  const handleDeleteRoom = useCallback(async (targetRoom) => {
    const roomName = targetRoom?.name || 'Szafa prywatna'
    if (!targetRoom?.id || !window.confirm(`Czy na pewno chcesz usunąć szafę "${roomName}"?`)) return

    await executeAction(
      () => deleteRoom(targetRoom.id, targetRoom.guestToken),
      'Nie udało się usunąć szafy.',
    )
  }, [executeAction])

  const handleCreateRoom = useCallback(async (roomMode = null, extraSettings = {}) => {
    if (!auth.user) return
    setCreatingRoom(true)

    const ref = auth.user.isAnonymous
      ? await executeAction(
        () => createPublicRoom('Nowa szafa publiczna', auth.user.uid, roomMode, extraSettings),
        'Nie udało się utworzyć szafy publicznej.',
      )
      : await executeAction(
        () => createPrivateRoom(auth.user.uid, 'Nowa szafa prywatna', roomMode, extraSettings),
        'Nie udało się utworzyć szafy prywatnej.',
      )

    setCreatingRoom(false)
    if (ref?.id) route.navigateToRoom(ref.id)
  }, [auth.user, executeAction, route, setCreatingRoom])

  const handleCreateRoomFromYt = useCallback(async (name, songs) => {
    if (!auth.user || auth.user.isAnonymous) return
    const ref = await executeAction(async () => {
      const roomRef = await createPrivateRoom(auth.user.uid, name)
      if (songs.length > 0) {
        const songsWithIds = attachSongIds(songs, genId)
        await replaceRoomSongs(roomRef.id, songsWithIds)
      }
      return roomRef
    }, 'Nie udało się utworzyć szafy z YouTube.')
    if (ref?.id) route.navigateToRoom(ref.id)
  }, [auth.user, executeAction, route])

  const handleAddYtToRoom = useCallback(async (targetRoomId, ytSongs) => {
    const targetRoom = ownedRooms.find((ownedRoom) => ownedRoom.id === targetRoomId)
    if (!targetRoom) return

    const songsWithIds = attachSongIds(ytSongs, genId)
    const mergedSongs = mergeUniqueSongs(targetRoom.songs ?? [], songsWithIds)

    await executeAction(
      () => replaceRoomSongs(targetRoomId, mergedSongs),
      'Nie udało się dodać piosenek do szafy.',
    )

    if (targetRoomId !== auth.roomId) {
      route.navigateToRoom(targetRoomId)
    }
  }, [auth.roomId, executeAction, ownedRooms, route])

  const handleCopyRoom = useCallback(async () => {
    if (!auth.user || auth.user.isAnonymous || !room || canEditRoom) return
    setCopyingRoom(true)
    const ref = await executeAction(
      () => createPrivateRoomCopy(auth.user.uid, room),
      'Nie udało się skopiować szafy.',
    )
    setCopyingRoom(false)
    if (ref?.id) route.navigateToRoom(ref.id)
  }, [auth.user, canEditRoom, executeAction, room, route, setCopyingRoom])

  const handleAppendToRoom = useCallback(async (targetRoomId) => {
    const targetRoom = ownedRooms.find((ownedRoom) => ownedRoom.id === targetRoomId)
    if (!targetRoom || !room) return

    setAppendingRoom(true)
    const mergedSongs = mergeUniqueSongs(targetRoom.songs ?? [], room.songs ?? [])
    await executeAction(
      () => replaceRoomSongs(targetRoomId, mergedSongs),
      'Nie udało się dołączyć piosenek.',
    )
    setAppendingRoom(false)
  }, [executeAction, ownedRooms, room, setAppendingRoom])

  const handleJoinRoom = useCallback((input) => {
    const roomValue = resolveRoomInput(input)
    if (roomValue) route.navigateToRoom(roomValue)
  }, [route])

  const _handleSeedRooms = useCallback(async () => {
    if (!window.confirm('Utworzyć 5 przykładowych list w bazie danych?')) return
    try {
      alert('Seed flow removed.')
      alert('Gotowe! Odśwież stronę, aby zobaczyć listy.')
    } catch (error) {
      alert(`Błąd: ${error.message}`)
    }
  }, [])

  const handleCreatePartyRoom = useCallback(async (name, extraSettings = {}) => {
    if (!auth.user || auth.user.isAnonymous) return null
    setCreatingRoom(true)
    const result = await executeAction(
      () => createPartyRoom(auth.user.uid, name, extraSettings),
      'Nie udało się utworzyć szafy.',
    )
    setCreatingRoom(false)
    return result ?? null
  }, [auth.user, executeAction, setCreatingRoom])

  return {
    renameRoom,
    handleDeleteRoom,
    handleCreateRoom,
    handleCreatePartyRoom,
    handleCreateRoomFromYt,
    handleAddYtToRoom,
    handleCopyRoom,
    handleAppendToRoom,
    handleJoinRoom,
  }
}

export function useRoomSettingsCommands({
  auth,
  canEditRoom,
  executeAction,
  resizeVotingOptions,
  roomGuestToken,
  roomType,
}) {
  const saveSettings = useCallback(async (key, value) => {
    if (!auth.roomId || !canEditRoom) return

    await executeAction(() => saveRoomSetting(auth.roomId, key, value), 'Nie udało się zapisać ustawień.')
    if (key === 'queueSize') {
      await executeAction(() => resizeVotingOptions(value), 'Nie udało się zaktualizować opcji głosowania.')
    }
  }, [auth.roomId, canEditRoom, executeAction, resizeVotingOptions])

  const changeRoomCode = useCallback(async (newCode) => {
    if (!auth.roomId || !canEditRoom) return { error: 'no_permission' }
    try {
      await changeRoomGuestToken(auth.roomId, roomGuestToken, newCode, roomType)
      return { success: true }
    } catch (error) {
      if (error.message === 'taken') return { error: 'taken' }
      return { error: 'generic' }
    }
  }, [auth.roomId, canEditRoom, roomGuestToken, roomType])

  return {
    saveSettings,
    changeRoomCode,
  }
}

export function useRoomVotingCommands({
  auth,
  canEditRoom,
  room,
  executeAction,
  userId,
  isPlaying,
  mySkipVote,
}) {
  const vote = useCallback(async (optionKey) => {
    if (!auth.user || !auth.roomId || !room) return

    const currentVote = (room.nextVotes ?? {})[auth.user.uid]
    if (currentVote !== optionKey) incrementRoomVotes(auth.roomId).catch(() => {})
    await executeAction(
      () => voteNextOption(auth.roomId, auth.user.uid, optionKey, currentVote),
      'Nie udało się zapisać głosu.',
    )
  }, [auth.roomId, auth.user, executeAction, room])

  const voteSkip = useCallback(async () => {
    if (!userId || !auth.roomId || !isPlaying) return
    await executeAction(
      () => toggleSkipVote(auth.roomId, userId, mySkipVote),
      'Nie udało się zapisać głosu pominięcia.',
    )
  }, [auth.roomId, executeAction, isPlaying, mySkipVote, userId])

  const rateActivePlaylist = useCallback(async (score) => {
    if (!userId || !auth.roomId) return
    await rateRoom(auth.roomId, userId, score)
  }, [auth.roomId, userId])

  const submitVotingProposal = useCallback(async (song, key) => {
    if (!auth.roomId || !userId) return false
    const done = await executeAction(
      () => setVotingProposal(auth.roomId, key ?? userId, song),
      'Nie udało się wysłać propozycji.',
    )
    return done !== null
  }, [auth.roomId, executeAction, userId])

  const removeVotingProposal = useCallback(async (targetUserId) => {
    if (!auth.roomId || !canEditRoom) return
    await executeAction(
      () => clearVotingProposals(auth.roomId, [targetUserId]),
      'Nie udało się usunąć propozycji.',
    )
  }, [auth.roomId, canEditRoom, executeAction])

  return {
    vote,
    voteSkip,
    rateActivePlaylist,
    submitVotingProposal,
    removeVotingProposal,
  }
}

export function useRoomSuggestionCommands({
  auth,
  room,
  suggestions,
  canEditRoom,
  executeAction,
  dispatch,
  userId,
}) {
  const submitSuggestion = useCallback(async ({ title, ytId, url }) => {
    if (!auth.roomId || !userId) return false
    const done = await executeAction(
      () => addSuggestion(auth.roomId, userId, { title, ytId, url }),
      'Nie udało się wysłać propozycji.',
    )
    return done !== null
  }, [auth.roomId, executeAction, userId])

  const submitSongToList = useCallback(async ({ title, ytId, url }) => {
    if (!auth.roomId || !userId) return false
    const song = createSong({ genId, title, ytId, url, addedBy: { uid: userId } })
    const done = await executeAction(
      () => addSongToList(auth.roomId, song),
      'Nie udało się dodać piosenki do listy.',
    )
    return done !== null
  }, [auth.roomId, executeAction, userId])

  const submitPlaylistSuggestion = useCallback(async ({ songs }) => {
    if (!auth.roomId || !userId) return false

    const suggestionsPerUser = room?.settings?.suggestionsPerUser ?? null
    let songsToSubmit = songs
    if (suggestionsPerUser != null) {
      const existingCount = (suggestions ?? []).filter((suggestion) => suggestion.userId === userId).length
      const remaining = Math.max(0, suggestionsPerUser - existingCount)
      songsToSubmit = songs.slice(0, remaining)
    }
    if (songsToSubmit.length === 0) return true

    const done = await executeAction(
      () => Promise.all(
        songsToSubmit.map((song) => addSuggestion(auth.roomId, userId, {
          title: song.title,
          ytId: song.ytId,
          url: song.url,
        })),
      ),
      'Nie udało się wysłać propozycji playlisty.',
    )
    return done !== null
  }, [auth.roomId, executeAction, room, suggestions, userId])

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
      throw new Error(error?.message || 'Nie udało się wysłać wiadomości.')
    }
  }, [userId])

  const approveSuggestion = useCallback(async (suggestion) => {
    if (!auth.roomId || !room || !canEditRoom) return

    const isDuplicate = (room.songs ?? []).some((song) => song.ytId === suggestion.ytId)
    if (isDuplicate) {
      dispatch({ type: 'setField', field: 'uiError', value: `"${suggestion.title}" jest już na liście.` })
      setTimeout(() => dispatch({ type: 'setField', field: 'uiError', value: '' }), 3000)
      return
    }

    const song = createSong({
      genId,
      title: suggestion.title,
      ytId: suggestion.ytId,
      url: suggestion.url,
      addedBy: createAddedBySuggestion(suggestion),
    })

    await executeAction(async () => {
      await replaceRoomSongs(auth.roomId, [...(room.songs ?? []), song])
      await deleteSuggestion(auth.roomId, suggestion.id)
      await setVotingProposal(auth.roomId, song.id, song)
    }, 'Nie udało się zatwierdzić propozycji.')
  }, [auth.roomId, canEditRoom, dispatch, executeAction, room])

  const approveAllSuggestions = useCallback(async (pendingSuggestions) => {
    if (!auth.roomId || !room || !canEditRoom || !pendingSuggestions?.length) return

    const existingYtIds = new Set((room.songs ?? []).map((song) => song.ytId))
    const newSongs = pendingSuggestions
      .filter((suggestion) => !existingYtIds.has(suggestion.ytId))
      .map((suggestion) => createSong({
        genId,
        title: suggestion.title,
        ytId: suggestion.ytId,
        url: suggestion.url,
        addedBy: createAddedBySuggestion(suggestion),
      }))

    await executeAction(async () => {
      await replaceRoomSongs(auth.roomId, [...(room.songs ?? []), ...newSongs])
      await Promise.all(pendingSuggestions.map((suggestion) => deleteSuggestion(auth.roomId, suggestion.id)))
      await Promise.all(newSongs.map((song) => setVotingProposal(auth.roomId, song.id, song)))
    }, 'Nie udało się zatwierdzić wszystkich propozycji.')
  }, [auth.roomId, canEditRoom, executeAction, room])

  const rejectSuggestion = useCallback(async (suggestionId) => {
    if (!auth.roomId || !canEditRoom) return
    await executeAction(
      () => deleteSuggestion(auth.roomId, suggestionId),
      'Nie udało się odrzucić propozycji.',
    )
  }, [auth.roomId, canEditRoom, executeAction])

  const rejectAllSuggestions = useCallback(async (pendingSuggestions) => {
    if (!auth.roomId || !canEditRoom || !pendingSuggestions?.length) return
    await executeAction(
      () => Promise.all(pendingSuggestions.map((s) => deleteSuggestion(auth.roomId, s.id))),
      'Nie udało się odrzucić wszystkich propozycji.',
    )
  }, [auth.roomId, canEditRoom, executeAction])

  return {
    submitSuggestion,
    submitSongToList,
    submitPlaylistSuggestion,
    submitContactMessage,
    approveSuggestion,
    approveAllSuggestions,
    rejectSuggestion,
    rejectAllSuggestions,
  }
}
