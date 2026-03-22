import { useCallback, useEffect, useState } from 'react'
import { createAddedByUser, createSong } from '../domain/song'
import {
  cleanTitle,
  extractYtId,
  extractYtPlaylistId,
  fetchYtPlaylistItems,
  fetchYtTitle,
  searchYouTube,
} from '../lib/youtube'
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
    const isDuplicate = (room.songs ?? []).some((song) => song.ytId === suggestion.ytId)
    if (isDuplicate) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Ten utwor jest juz na liscie.' })
      return
    }

    const song = createSong({
      genId,
      title: suggestion.title,
      ytId: suggestion.ytId,
      addedBy: createAddedByUser(user),
    })

    await executeAction(
      () => replaceRoomSongs(roomId, [...(room.songs ?? []), song]),
      'Nie udalo sie dodac utworu.',
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
        dispatch({ type: 'setField', field: 'urlErr', value: 'Listy "Mix" i "Polecane przez YouTube" nie sa dostepne przez API. Dodaj utwory recznie lub uzyj zwyklej playlisty YT.' })
        return
      }
      dispatch({ type: 'setField', field: 'ytPlaylistId', value: playlistId })
      return
    }

    dispatch({ type: 'setField', field: 'ytPlaylistId', value: null })
    if (newSongTitle.trim()) return

    const ytId = extractYtId(url)
    if (!ytId) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Nieprawidlowy link YouTube' })
      return
    }

    dispatch({ type: 'songTitleFetchStart' })
    const title = await executeAction(() => fetchYtTitle(url), 'Nie udalo sie pobrac tytulu utworu.')
    if (title) dispatch({ type: 'setField', field: 'newSongTitle', value: cleanTitle(title) })
    dispatch({ type: 'songTitleFetchEnd' })
  }, [dispatch, executeAction, newSongTitle, newSongUrl])

  const importFromYouTube = useCallback(async () => {
    if (!ytPlaylistId || !roomId) return

    dispatch({ type: 'setField', field: 'importingYtPlaylist', value: true })
    const done = await executeAction(async () => {
      const fetched = await fetchYtPlaylistItems(ytPlaylistId)
      if (fetched.length === 0) throw new Error('Playlista pusta lub niedostepna przez API')

      const existing = room?.songs ?? []
      const existingIds = new Set(existing.map((song) => song.ytId))
      const newSongs = fetched
        .filter((song) => !existingIds.has(song.ytId))
        .map((song) => createSong({
          genId,
          ...song,
          title: cleanTitle(song.title),
        }))
      if (newSongs.length === 0) throw new Error('Wszystkie utwory z tej playlisty sa juz na liscie.')
      return replaceRoomSongs(roomId, [...existing, ...newSongs])
    }, 'Nie udalo sie zaimportowac playlisty YouTube.')
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
      dispatch({ type: 'setField', field: 'urlErr', value: 'Nieprawidlowy link YouTube' })
      return
    }

    const isDuplicate = (room?.songs ?? []).some((song) => song.ytId === ytId)
    if (isDuplicate) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Ten utwor jest juz na liscie.' })
      return
    }

    const cleanUrl = `https://youtu.be/${ytId}`
    let title = newSongTitle.trim()
    if (!title) {
      dispatch({ type: 'songTitleFetchStart' })
      title = await executeAction(() => fetchYtTitle(cleanUrl), 'Nie udalo sie pobrac tytulu.') ?? ''
      dispatch({ type: 'songTitleFetchEnd' })
    }

    const song = createSong({
      genId,
      url: cleanUrl,
      title: cleanTitle(title) || cleanUrl,
      ytId,
      addedBy: createAddedByUser(user),
    })

    const done = await executeAction(
      () => replaceRoomSongs(roomId, [...(room?.songs ?? []), song]),
      'Nie udalo sie dodac utworu.',
    )
    if (done === null) return

    dispatch({ type: 'songAdded' })
  }, [dispatch, executeAction, genId, newSongTitle, newSongUrl, room, roomId, user])

  const deleteSong = useCallback(async (songId) => {
    if (!room || !roomId) return

    await executeAction(
      () => replaceRoomSongs(roomId, room.songs.filter((song) => song.id !== songId)),
      'Nie udalo sie usunac utworu.',
    )
  }, [executeAction, room, roomId])

  const deleteSongs = useCallback(async (songIds) => {
    if (!room || !roomId || songIds.length === 0) return
    const idSet = new Set(songIds)
    await executeAction(
      () => replaceRoomSongs(roomId, room.songs.filter((song) => !idSet.has(song.id))),
      'Nie udalo sie usunac utworow.',
    )
  }, [executeAction, room, roomId])

  const updateSong = useCallback(async (songId, updates) => {
    if (!room || !roomId) return
    const updatedSongs = room.songs.map((song) =>
      song.id === songId ? { ...song, ...updates } : song
    )
    await executeAction(
      () => replaceRoomSongs(roomId, updatedSongs),
      'Nie udalo sie zaktualizowac utworu.',
    )
  }, [executeAction, room, roomId])

  return {
    handleUrlBlur,
    importFromYouTube,
    addSong,
    deleteSong,
    deleteSongs,
    updateSong,
    suggestions,
    isSearching,
    selectSuggestion,
    clearSuggestions,
  }
}
