import { useCallback, useEffect, useState } from 'react'
import { cleanTitle, extractYtId, extractYtPlaylistId, fetchYtPlaylistItems, fetchYtTitle, searchYouTube } from '../lib/youtube'
import { replaceRoomSongs } from '../services/jukeboxService'

export function useSongActions({
  roomId,
  room,
  newSongUrl,
  newSongTitle,
  ytPlaylistId,
  executeAction,
  dispatch,
  genId,
  user,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const isUrl = newSongUrl.includes('youtube.com') || newSongUrl.includes('youtu.be')
    if (isUrl || newSongUrl.trim().length < 3) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchYouTube(newSongUrl.trim(), 5)
        setSuggestions(results)
      } catch {
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [newSongUrl])

  const selectSuggestion = useCallback(async (suggestion) => {
    if (!roomId || !room) return
    setSuggestions([])
    const isDuplicate = (room.songs ?? []).some((s) => s.ytId === suggestion.ytId)
    if (isDuplicate) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Ten utwór jest już na liście.' })
      return
    }
    const addedBy = user && !user.isAnonymous
      ? { uid: user.uid, name: user.displayName || user.email || null }
      : null
    const song = {
      id: genId(),
      title: suggestion.title,
      ytId: suggestion.ytId,
      url: `https://youtu.be/${suggestion.ytId}`,
      ...(addedBy ? { addedBy } : {}),
    }
    await executeAction(
      () => replaceRoomSongs(roomId, [...(room.songs ?? []), song]),
      'Nie udało się dodać utworu.',
    )
    dispatch({ type: 'songAdded' })
  }, [dispatch, executeAction, genId, room, roomId, user])

  const clearSuggestions = useCallback(() => setSuggestions([]), [])

  const handleUrlBlur = useCallback(async () => {
    const url = newSongUrl.trim()
    if (!url) return

    const playlistId = extractYtPlaylistId(url)
    if (playlistId) {
      if (playlistId.startsWith('RD')) {
        dispatch({ type: 'setField', field: 'urlErr', value: 'Listy "Mix" i "Polecane przez YouTube" nie są dostępne przez API. Dodaj utwory ręcznie lub użyj zwykłej playlisty YT.' })
        return
      }
      dispatch({ type: 'setField', field: 'ytPlaylistId', value: playlistId })
      return
    }

    dispatch({ type: 'setField', field: 'ytPlaylistId', value: null })
    if (newSongTitle.trim()) return

    const ytId = extractYtId(url)
    if (!ytId) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Nieprawidłowy link YouTube' })
      return
    }

    dispatch({ type: 'songTitleFetchStart' })
    const title = await executeAction(() => fetchYtTitle(url), 'Nie udało się pobrać tytułu utworu.')
    if (title) dispatch({ type: 'setField', field: 'newSongTitle', value: cleanTitle(title) })
    dispatch({ type: 'songTitleFetchEnd' })
  }, [dispatch, executeAction, newSongTitle, newSongUrl])

  const importFromYouTube = useCallback(async () => {
    if (!ytPlaylistId || !roomId) return

    dispatch({ type: 'setField', field: 'importingYtPlaylist', value: true })
    const done = await executeAction(async () => {
      const fetched = await fetchYtPlaylistItems(ytPlaylistId)
      if (fetched.length === 0) throw new Error('Playlista pusta lub niedostępna przez API')

      const existing = room?.songs ?? []
      const existingIds = new Set(existing.map((s) => s.ytId))
      const newSongs = fetched
        .filter((song) => !existingIds.has(song.ytId))
        .map((song) => ({ id: genId(), ...song, title: cleanTitle(song.title) }))
      if (newSongs.length === 0) throw new Error('Wszystkie utwory z tej playlisty są już na liście.')
      return replaceRoomSongs(roomId, [...existing, ...newSongs])
    }, 'Nie udało się zaimportować playlisty YouTube.')
    dispatch({ type: 'setField', field: 'importingYtPlaylist', value: false })

    if (done !== null) {
      dispatch({ type: 'setField', field: 'newSongUrl', value: '' })
      dispatch({ type: 'setField', field: 'ytPlaylistId', value: null })
    }
  }, [dispatch, executeAction, genId, room, roomId, ytPlaylistId])

  const addSong = useCallback(async () => {
    const url = newSongUrl.trim()
    if (!url || !roomId) return

    const ytId = extractYtId(url)
    if (!ytId) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Nieprawidłowy link YouTube' })
      return
    }

    const isDuplicate = (room?.songs ?? []).some((s) => s.ytId === ytId)
    if (isDuplicate) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Ten utwór jest już na liście.' })
      return
    }

    const cleanUrl = `https://youtu.be/${ytId}`
    let title = newSongTitle.trim()
    if (!title) {
      dispatch({ type: 'songTitleFetchStart' })
      title = await executeAction(() => fetchYtTitle(cleanUrl), 'Nie udało się pobrać tytułu.') ?? ''
      dispatch({ type: 'songTitleFetchEnd' })
    }

    const addedBy = user && !user.isAnonymous
      ? { uid: user.uid, name: user.displayName || user.email || null }
      : null
    const song = {
      id: genId(),
      url: cleanUrl,
      title: cleanTitle(title) || cleanUrl,
      ytId,
      ...(addedBy ? { addedBy } : {}),
    }
    const done = await executeAction(
      () => replaceRoomSongs(roomId, [...(room?.songs ?? []), song]),
      'Nie udało się dodać utworu.',
    )
    if (done === null) return

    dispatch({ type: 'songAdded' })
  }, [dispatch, executeAction, genId, newSongTitle, newSongUrl, room, roomId, user])

  const deleteSong = useCallback(async (songId) => {
    if (!room || !roomId) return

    await executeAction(
      () => replaceRoomSongs(roomId, room.songs.filter((song) => song.id !== songId)),
      'Nie udało się usunąć utworu.',
    )
  }, [executeAction, room, roomId])

  const deleteSongs = useCallback(async (songIds) => {
    if (!room || !roomId || songIds.length === 0) return
    const idSet = new Set(songIds)
    await executeAction(
      () => replaceRoomSongs(roomId, room.songs.filter((song) => !idSet.has(song.id))),
      'Nie udało się usunąć utworów.',
    )
  }, [executeAction, room, roomId])

  return {
    handleUrlBlur,
    importFromYouTube,
    addSong,
    deleteSong,
    deleteSongs,
    suggestions,
    isSearching,
    selectSuggestion,
    clearSuggestions,
  }
}
