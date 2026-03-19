import { useCallback } from 'react'
import { renameRoom, replaceRoomSongs } from '../services/jukeboxService'

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
  room,
  editingName,
  executeAction,
  dispatch,
  genId,
}) {
  const exportPlaylist = useCallback(() => {
    if (!room) return

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      playlist: {
        name: room.name,
        songs: room.songs ?? [],
      },
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = (room.name || 'playlist')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'playlist'

    link.href = url
    link.download = `${safeName}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [room])

  const importPlaylist = useCallback(async (file) => {
    if (!file || !roomId) return

    const done = await executeAction(async () => {
      const raw = await file.text()
      const parsed = JSON.parse(raw)
      const playlistData = parsed?.playlist ?? parsed
      const importedName = typeof playlistData?.name === 'string' ? playlistData.name.trim() : ''
      const songs = sanitizeImportedSongs(playlistData?.songs, genId)

      if (songs.length === 0) {
        throw new Error('Imported playlist does not contain valid songs.')
      }

      await replaceRoomSongs(roomId, songs)
      if (importedName) {
        await renameRoom(roomId, importedName)
      }
      return true
    }, 'Nie udało się zaimportować playlisty z pliku JSON.')

    if (done) dispatch({ type: 'cancelPlaylistEdit' })
  }, [dispatch, executeAction, genId, roomId])

  const saveEditPlaylist = useCallback(async () => {
    const name = editingName.trim()
    if (name && roomId) {
      await executeAction(() => renameRoom(roomId, name), 'Nie udało się zmienić nazwy pokoju.')
    }

    dispatch({ type: 'cancelPlaylistEdit' })
  }, [dispatch, editingName, executeAction, roomId])

  return {
    exportPlaylist,
    importPlaylist,
    saveEditPlaylist,
  }
}
