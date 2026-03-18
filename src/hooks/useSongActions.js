import { useCallback } from 'react'
import { extractYtId, extractYtPlaylistId, fetchYtPlaylistItems, fetchYtTitle } from '../lib/youtube'
import { replacePlaylistSongs } from '../services/jukeboxService'

export function useSongActions({
  roomId,
  activePlaylist,
  activePlaylistId,
  newSongUrl,
  newSongTitle,
  ytPlaylistId,
  executeAction,
  dispatch,
  genId,
}) {
  const handleUrlBlur = useCallback(async () => {
    const url = newSongUrl.trim()
    if (!url) return

    const playlistId = extractYtPlaylistId(url)
    if (playlistId) {
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
    if (title) dispatch({ type: 'setField', field: 'newSongTitle', value: title })
    dispatch({ type: 'songTitleFetchEnd' })
  }, [dispatch, executeAction, newSongTitle, newSongUrl])

  const importFromYouTube = useCallback(async () => {
    if (!ytPlaylistId || !activePlaylistId || !roomId) return

    dispatch({ type: 'setField', field: 'importingYtPlaylist', value: true })
    const done = await executeAction(async () => {
      const fetched = await fetchYtPlaylistItems(ytPlaylistId)
      if (fetched.length === 0) throw new Error('Playlista pusta lub niedostępna przez API')

      const newSongs = fetched.map((song) => ({ id: genId(), ...song }))
      const existing = activePlaylist?.songs ?? []
      return replacePlaylistSongs(roomId, activePlaylistId, [...existing, ...newSongs])
    }, 'Nie udało się zaimportować playlisty YouTube.')
    dispatch({ type: 'setField', field: 'importingYtPlaylist', value: false })

    if (done !== null) {
      dispatch({ type: 'setField', field: 'newSongUrl', value: '' })
      dispatch({ type: 'setField', field: 'ytPlaylistId', value: null })
    }
  }, [activePlaylist, activePlaylistId, dispatch, executeAction, genId, roomId, ytPlaylistId])

  const addSong = useCallback(async () => {
    const url = newSongUrl.trim()
    if (!url || !activePlaylistId || !roomId) return

    const ytId = extractYtId(url)
    if (!ytId) {
      dispatch({ type: 'setField', field: 'urlErr', value: 'Nieprawidłowy link YouTube' })
      return
    }

    const cleanUrl = `https://youtu.be/${ytId}`
    let title = newSongTitle.trim()
    if (!title) {
      dispatch({ type: 'songTitleFetchStart' })
      title = await executeAction(() => fetchYtTitle(cleanUrl), 'Nie udało się pobrać tytułu.') ?? ''
      dispatch({ type: 'songTitleFetchEnd' })
    }

    const song = { id: genId(), url: cleanUrl, title: title || cleanUrl, ytId }
    const done = await executeAction(
      () => replacePlaylistSongs(roomId, activePlaylistId, [...(activePlaylist?.songs ?? []), song]),
      'Nie udało się dodać utworu.',
    )
    if (done === null) return

    dispatch({ type: 'songAdded' })
  }, [activePlaylist, activePlaylistId, dispatch, executeAction, genId, newSongTitle, newSongUrl, roomId])

  const deleteSong = useCallback(async (songId) => {
    if (!activePlaylist || !roomId) return

    await executeAction(
      () => replacePlaylistSongs(roomId, activePlaylistId, activePlaylist.songs.filter((song) => song.id !== songId)),
      'Nie udało się usunąć utworu.',
    )
  }, [activePlaylist, activePlaylistId, executeAction, roomId])

  return {
    handleUrlBlur,
    importFromYouTube,
    addSong,
    deleteSong,
  }
}
