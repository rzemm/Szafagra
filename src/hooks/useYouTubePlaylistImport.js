import { useEffect, useState } from 'react'
import {
  fetchLikedVideosPage,
  fetchUserYtPlaylists,
  fetchYtPlaylistPage,
  YT_LIKED_PLAYLIST_ID,
} from '../lib/youtube'

export function useYouTubePlaylistImport({ accessToken, onClose, onImportAllSongs }) {
  const [playlists, setPlaylists] = useState(null)
  const [loadingPlaylists, setLoadingPlaylists] = useState(true)
  const [playlistsError, setPlaylistsError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [songs, setSongs] = useState(null)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [loadingSongs, setLoadingSongs] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [songsError, setSongsError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [selectedSongIds, setSelectedSongIds] = useState(new Set())
  const [likedTotalCount, setLikedTotalCount] = useState(null)
  const [importingPlaylistId, setImportingPlaylistId] = useState(null)

  useEffect(() => {
    let active = true

    setLoadingPlaylists(true)
    setPlaylistsError(null)
    fetchUserYtPlaylists(accessToken)
      .then((data) => {
        if (!active) return
        setPlaylists(data)
        setLoadingPlaylists(false)
      })
      .catch((error) => {
        if (!active) return
        setPlaylistsError(error.message)
        setLoadingPlaylists(false)
      })

    return () => {
      active = false
    }
  }, [accessToken])

  const isLikedView = selected?.id === YT_LIKED_PLAYLIST_ID
  const regularPlaylists = playlists ? playlists.filter((playlist) => playlist.id !== YT_LIKED_PLAYLIST_ID) : []
  const likedPlaylist = playlists ? playlists.find((playlist) => playlist.id === YT_LIKED_PLAYLIST_ID) : null

  const handleSelect = async (playlist) => {
    setSelected(playlist)
    setSongs(null)
    setNextPageToken(null)
    setSongsError(null)
    setLoadingSongs(true)
    setSelectedSongIds(new Set())
    setLikedTotalCount(null)

    try {
      const { items, nextPageToken: next, totalResults } = playlist.id === YT_LIKED_PLAYLIST_ID
        ? await fetchLikedVideosPage(accessToken)
        : await fetchYtPlaylistPage(playlist.id, accessToken)
      setSongs(items)
      setNextPageToken(next)
      if (playlist.id === YT_LIKED_PLAYLIST_ID && totalResults != null) {
        setLikedTotalCount(totalResults)
      }
    } catch (error) {
      setSongsError(error.message)
    } finally {
      setLoadingSongs(false)
    }
  }

  const handleLoadMore = async () => {
    if (!nextPageToken || !selected || loadingMore) return
    setLoadingMore(true)

    try {
      const { items, nextPageToken: next } = isLikedView
        ? await fetchLikedVideosPage(accessToken, nextPageToken)
        : await fetchYtPlaylistPage(selected.id, accessToken, nextPageToken)
      setSongs((previousSongs) => [...(previousSongs ?? []), ...items])
      setNextPageToken(next)
    } catch {
      // Ignore recoverable pagination errors.
    } finally {
      setLoadingMore(false)
    }
  }

  const handleBack = () => {
    setSelected(null)
    setSongs(null)
    setNextPageToken(null)
    setSongsError(null)
    setSelectedSongIds(new Set())
  }

  const toggleSongSelection = (ytId) => {
    setSelectedSongIds((previousSongIds) => {
      const nextSongIds = new Set(previousSongIds)
      if (nextSongIds.has(ytId)) nextSongIds.delete(ytId)
      else nextSongIds.add(ytId)
      return nextSongIds
    })
  }

  const handleImportSelected = async () => {
    if (busy || selectedSongIds.size === 0 || !songs || !onImportAllSongs) return
    setBusy(true)

    try {
      const selectedSongs = songs.filter((song) => selectedSongIds.has(song.ytId))
      await onImportAllSongs(selectedSongs)
      setSelectedSongIds(new Set())
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const handleImportAll = async () => {
    if (busy || !selected || !onImportAllSongs) return
    setBusy(true)

    try {
      let allSongs = [...(songs ?? [])]
      let token = nextPageToken

      while (token) {
        const { items, nextPageToken: next } = isLikedView
          ? await fetchLikedVideosPage(accessToken, token)
          : await fetchYtPlaylistPage(selected.id, accessToken, token)
        allSongs = [...allSongs, ...items]
        token = next
      }

      await onImportAllSongs(allSongs)
      onClose()
    } catch {
      // Keep the modal open so the user can retry.
    } finally {
      setBusy(false)
    }
  }

  const handleImportAllDirect = async (playlist, event) => {
    event.stopPropagation()
    if (importingPlaylistId || !onImportAllSongs) return
    setImportingPlaylistId(playlist.id)

    try {
      const isLiked = playlist.id === YT_LIKED_PLAYLIST_ID
      let allSongs = []
      let token = null

      do {
        const { items, nextPageToken: next } = isLiked
          ? await fetchLikedVideosPage(accessToken, token)
          : await fetchYtPlaylistPage(playlist.id, accessToken, token)
        allSongs = [...allSongs, ...items]
        token = next
      } while (token)

      await onImportAllSongs(allSongs)
      onClose()
    } catch {
      // Keep the modal open so the user can retry.
    } finally {
      setImportingPlaylistId(null)
    }
  }

  return {
    busy,
    handleBack,
    handleImportAll,
    handleImportAllDirect,
    handleImportSelected,
    handleLoadMore,
    handleSelect,
    importingPlaylistId,
    isLikedView,
    likedPlaylist,
    likedTotalCount,
    loadingMore,
    loadingPlaylists,
    loadingSongs,
    nextPageToken,
    playlists,
    playlistsError,
    regularPlaylists,
    selected,
    selectedSongIds,
    songs,
    songsError,
    toggleSongSelection,
  }
}
