import { useCallback } from 'react'
import {
  createPlaylist,
  createPlaylistWithSongs,
  removePlaylist,
  renamePlaylist,
} from '../services/jukeboxService'

function sanitizeImportedSongs(songs, genId) {
  if (!Array.isArray(songs)) return []

  return songs
    .map((song) => {
      const title = typeof song?.title === 'string' ? song.title.trim() : ''
      const ytId = typeof song?.ytId === 'string' ? song.ytId.trim() : ''
      const sourceUrl = typeof song?.url === 'string' ? song.url.trim() : ''
      const url = sourceUrl || (ytId ? `https://youtu.be/${ytId}` : '')

      if (!title || !ytId || !url) return null

      return {
        id: typeof song?.id === 'string' && song.id.trim() ? song.id.trim() : genId(),
        title,
        ytId,
        url,
      }
    })
    .filter(Boolean)
}

export function usePlaylistActions({
  roomId,
  activePlaylist,
  activePlaylistId,
  newPlaylistName,
  editingId,
  editingName,
  executeAction,
  selectPlaylist,
  dispatch,
  genId,
}) {
  const addPlaylist = useCallback(async () => {
    const name = newPlaylistName.trim()
    if (!name || !roomId) return

    const ref = await executeAction(() => createPlaylist(roomId, name), 'Nie udało się utworzyć playlisty.')
    if (!ref) return

    dispatch({ type: 'playlistAdded', playlistId: ref.id })
    selectPlaylist(ref.id)
  }, [dispatch, executeAction, newPlaylistName, roomId, selectPlaylist])

  const exportPlaylist = useCallback(() => {
    if (!activePlaylist) return

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      playlist: {
        name: activePlaylist.name,
        songs: activePlaylist.songs ?? [],
      },
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = (activePlaylist.name || 'playlist')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'playlist'

    link.href = url
    link.download = `${safeName}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [activePlaylist])

  const importPlaylist = useCallback(async (file) => {
    if (!file || !roomId) return

    const done = await executeAction(async () => {
      const raw = await file.text()
      const parsed = JSON.parse(raw)
      const playlistData = parsed?.playlist ?? parsed
      const name = typeof playlistData?.name === 'string' ? playlistData.name.trim() : ''
      const songs = sanitizeImportedSongs(playlistData?.songs, genId)

      if (!name) {
        throw new Error('Imported playlist is missing a valid name.')
      }

      if (songs.length === 0) {
        throw new Error('Imported playlist does not contain valid songs.')
      }

      return createPlaylistWithSongs(roomId, name, songs)
    }, 'Nie udało się zaimportować playlisty z pliku JSON.')

    if (!done) return

    dispatch({ type: 'playlistAdded', playlistId: done.id })
    selectPlaylist(done.id)
  }, [dispatch, executeAction, genId, roomId, selectPlaylist])

  const deletePlaylist = useCallback(async (playlistId) => {
    if (!roomId) return

    const done = await executeAction(() => removePlaylist(roomId, playlistId), 'Nie udało się usunąć playlisty.')
    if (done === null) return

    if (activePlaylistId === playlistId) selectPlaylist(null)
  }, [activePlaylistId, executeAction, roomId, selectPlaylist])

  const saveEditPlaylist = useCallback(async () => {
    const name = editingName.trim()
    if (name && editingId && roomId) {
      await executeAction(() => renamePlaylist(roomId, editingId, name), 'Nie udało się zmienić nazwy playlisty.')
    }

    dispatch({ type: 'cancelPlaylistEdit' })
  }, [dispatch, editingId, editingName, executeAction, roomId])

  return {
    addPlaylist,
    exportPlaylist,
    importPlaylist,
    deletePlaylist,
    saveEditPlaylist,
  }
}
