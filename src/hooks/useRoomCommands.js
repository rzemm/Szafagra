import { useCallback } from 'react'
import { attachSongIds, createAddedBySuggestion, createSong } from '../domain/song'
import { seedSampleRooms } from '../dev/seedRooms'
import { genId } from '../lib/jukebox'
import {
  addPlaylistSuggestion,
  addSuggestion,
  changeRoomGuestToken,
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

export function useRoomCommands({
  auth,
  canEditRoom,
  room,
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
  const renameRoom = useCallback(async (name) => {
    if (!auth.roomId || !canEditRoom) return
    await executeAction(() => setMainState(auth.roomId, { name }), 'Nie udało się zmienić nazwy szafy.')
  }, [auth.roomId, canEditRoom, executeAction])

  const handleDeleteRoom = useCallback(async (targetRoom) => {
    const roomName = targetRoom?.name || 'Szafa prywatna'
    if (!targetRoom?.id || !window.confirm(`Czy na pewno chcesz usunąć szafę "${roomName}"?`)) return

    await executeAction(
      () => deleteRoom(targetRoom.id, targetRoom.guestToken),
      'Nie udało się usunąć szafy.'
    )
  }, [executeAction])

  const handleCreateRoom = useCallback(async () => {
    if (!auth.user) return
    setCreatingRoom(true)

    const ref = auth.user.isAnonymous
      ? await executeAction(() => createPublicRoom('Nowa szafa publiczna', auth.user.uid), 'Nie udało się utworzyć szafy publicznej.')
      : await executeAction(() => createPrivateRoom(auth.user.uid, 'Nowa szafa prywatna'), 'Nie udało się utworzyć szafy prywatnej.')

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
    const existingYtIds = new Set((targetRoom.songs ?? []).map((song) => song.ytId))
    const newSongs = songsWithIds.filter((song) => !existingYtIds.has(song.ytId))
    const merged = [...(targetRoom.songs ?? []), ...newSongs]
    await executeAction(
      () => replaceRoomSongs(targetRoomId, merged),
      'Nie udało się dodać piosenek do szafy.'
    )
    route.navigateToRoom(targetRoomId)
  }, [executeAction, ownedRooms, route])

  const handleCopyRoom = useCallback(async () => {
    if (!auth.user || auth.user.isAnonymous || !room || canEditRoom) return
    setCopyingRoom(true)
    const ref = await executeAction(
      () => createPrivateRoomCopy(auth.user.uid, room),
      'Nie udało się skopiować szafy.'
    )
    setCopyingRoom(false)
    if (ref?.id) route.navigateToRoom(ref.id)
  }, [auth.user, canEditRoom, executeAction, room, route, setCopyingRoom])

  const handleAppendToRoom = useCallback(async (targetRoomId) => {
    const targetRoom = ownedRooms.find((ownedRoom) => ownedRoom.id === targetRoomId)
    if (!targetRoom || !room) return
    setAppendingRoom(true)
    const existingYtIds = new Set((targetRoom.songs ?? []).map((song) => song.ytId))
    const newSongs = (room.songs ?? []).filter((song) => !existingYtIds.has(song.ytId))
    const merged = [...(targetRoom.songs ?? []), ...newSongs]
    await executeAction(() => replaceRoomSongs(targetRoomId, merged), 'Nie udało się dołączyć piosenek.')
    setAppendingRoom(false)
  }, [executeAction, ownedRooms, room, setAppendingRoom])

  const handleJoinRoom = useCallback((input) => {
    const roomValue = resolveRoomInput(input)
    if (roomValue) route.navigateToRoom(roomValue)
  }, [route])

  const handleSeedRooms = useCallback(async () => {
    if (!window.confirm('Utworzyć 5 przykładowych list w bazie danych?')) return
    try {
      await seedSampleRooms()
      alert('Gotowe! Odśwież stronę, aby zobaczyć listy.')
    } catch (error) {
      alert(`Błąd: ${error.message}`)
    }
  }, [])

  const saveSettings = useCallback(async (key, value) => {
    if (!auth.roomId || !canEditRoom) return
    await executeAction(() => saveRoomSetting(auth.roomId, key, value), 'Nie udało się zapisać ustawień.')
    if (key === 'queueSize') {
      await executeAction(() => resizeVotingOptions(value), 'Nie udało się zaktualizować opcji głosowania.')
    }
  }, [auth.roomId, canEditRoom, executeAction, resizeVotingOptions])

  const vote = useCallback(async (optionKey) => {
    if (!auth.user || !auth.roomId || !room) return
    const currentVote = (room.nextVotes ?? {})[auth.user.uid]
    if (currentVote !== optionKey) incrementRoomVotes(auth.roomId).catch(() => {})
    await executeAction(() => voteNextOption(auth.roomId, auth.user.uid, optionKey, currentVote), 'Nie udało się zapisać głosu.')
  }, [auth.roomId, auth.user, executeAction, room])

  const voteSkip = useCallback(async () => {
    if (!userId || !auth.roomId || !isPlaying) return
    await executeAction(() => toggleSkipVote(auth.roomId, userId, mySkipVote), 'Nie udało się zapisać głosu pominięcia.')
  }, [auth.roomId, executeAction, isPlaying, mySkipVote, userId])

  const rateActivePlaylist = useCallback(async (score) => {
    if (!userId || !auth.roomId) return
    await rateRoom(auth.roomId, userId, score)
  }, [auth.roomId, userId])

  const submitSuggestion = useCallback(async ({ title, ytId, url }) => {
    if (!auth.roomId || !userId) return false
    const done = await executeAction(
      () => addSuggestion(auth.roomId, userId, { title, ytId, url }),
      'Nie udało się wysłać propozycji.'
    )
    return done !== null
  }, [auth.roomId, executeAction, userId])

  const submitPlaylistSuggestion = useCallback(async ({ playlistTitle, playlistId, songs }) => {
    if (!auth.roomId || !userId) return false
    const done = await executeAction(
      () => addPlaylistSuggestion(auth.roomId, userId, { playlistTitle, playlistId, songs }),
      'Nie udało się wysłać propozycji playlisty.'
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
      throw new Error(error?.message || 'Nie udało się wysłać wiadomości.')
    }
  }, [userId])

  const approveSuggestion = useCallback(async (suggestion) => {
    if (!auth.roomId || !room) return
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
    }, 'Nie udało się zatwierdzić propozycji.')
  }, [auth.roomId, dispatch, executeAction, room])

  const approvePlaylistSuggestion = useCallback(async (suggestion) => {
    if (!auth.roomId || !room) return
    const existingYtIds = new Set((room.songs ?? []).map((s) => s.ytId))
    const newSongs = (suggestion.songs ?? [])
      .filter((s) => !existingYtIds.has(s.ytId))
      .map((s) => createSong({ genId, title: s.title, ytId: s.ytId, url: s.url, addedBy: createAddedBySuggestion(suggestion) }))
    await executeAction(async () => {
      await replaceRoomSongs(auth.roomId, [...(room.songs ?? []), ...newSongs])
      await deleteSuggestion(auth.roomId, suggestion.id)
    }, 'Nie udało się zatwierdzić playlisty.')
  }, [auth.roomId, executeAction, room])

  const rejectSuggestion = useCallback(async (suggestionId) => {
    if (!auth.roomId) return
    await executeAction(() => deleteSuggestion(auth.roomId, suggestionId), 'Nie udało się odrzucić propozycji.')
  }, [auth.roomId, executeAction])

  const changeRoomCode = useCallback(async (newCode) => {
    if (!auth.roomId || !canEditRoom) return { error: 'no_permission' }
    try {
      await changeRoomGuestToken(auth.roomId, room?.guestToken ?? null, newCode, room?.type)
      return { success: true }
    } catch (err) {
      if (err.message === 'taken') return { error: 'taken' }
      return { error: 'generic' }
    }
  }, [auth.roomId, canEditRoom, room?.guestToken, room?.type])

  return {
    renameRoom,
    handleDeleteRoom,
    handleCreateRoom,
    handleCreateRoomFromYt,
    handleAddYtToRoom,
    handleCopyRoom,
    handleAppendToRoom,
    handleJoinRoom,
    handleSeedRooms,
    saveSettings,
    vote,
    voteSkip,
    rateActivePlaylist,
    submitSuggestion,
    submitPlaylistSuggestion,
    submitContactMessage,
    approveSuggestion,
    approvePlaylistSuggestion,
    rejectSuggestion,
    changeRoomCode,
  }
}
