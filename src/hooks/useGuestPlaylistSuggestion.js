import { useEffect, useState } from 'react'
import { fetchUserYtPlaylists, fetchYtPlaylistPage, fetchLikedVideosPage, YT_LIKED_PLAYLIST_ID } from '../lib/youtube'

export function useGuestPlaylistSuggestion({ ytAccessToken, submitPlaylistSuggestion }) {
  const [playlists, setPlaylists] = useState(null)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistSongs, setPlaylistSongs] = useState(null)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [loadingPlaylistSongs, setLoadingPlaylistSongs] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submittingPlaylist, setSubmittingPlaylist] = useState(false)
  const [submittedPlaylist, setSubmittedPlaylist] = useState(false)
  const [importProgress, setImportProgress] = useState(null)
  const [selectedSongIds, setSelectedSongIds] = useState(new Set())
  const [likedTotalCount, setLikedTotalCount] = useState(null)
  const [importingPlaylistId, setImportingPlaylistId] = useState(null)

  useEffect(() => {
    if (!ytAccessToken) return
    setPlaylists(null)
    setSelectedPlaylist(null)
    setPlaylistSongs(null)
    setLoadingPlaylists(true)
    fetchUserYtPlaylists(ytAccessToken)
      .then((data) => { setPlaylists(data); setLoadingPlaylists(false) })
      .catch(() => setLoadingPlaylists(false))
  }, [ytAccessToken])

  const handleSelectPlaylist = async (playlist) => {
    setSelectedPlaylist(playlist)
    setPlaylistSongs(null)
    setNextPageToken(null)
    setLoadingPlaylistSongs(true)
    setSelectedSongIds(new Set())
    setLikedTotalCount(null)
    const isLiked = playlist.id === YT_LIKED_PLAYLIST_ID
    try {
      const { items, nextPageToken: next, totalResults } = isLiked
        ? await fetchLikedVideosPage(ytAccessToken)
        : await fetchYtPlaylistPage(playlist.id, ytAccessToken)
      setPlaylistSongs(items)
      setNextPageToken(next)
      if (isLiked && totalResults != null) setLikedTotalCount(totalResults)
    } catch {
      setPlaylistSongs([])
    } finally {
      setLoadingPlaylistSongs(false)
    }
  }

  const handleLoadMore = async () => {
    if (!nextPageToken || !selectedPlaylist || loadingMore) return
    setLoadingMore(true)
    const isLiked = selectedPlaylist.id === YT_LIKED_PLAYLIST_ID
    try {
      const { items, nextPageToken: next } = isLiked
        ? await fetchLikedVideosPage(ytAccessToken, nextPageToken)
        : await fetchYtPlaylistPage(selectedPlaylist.id, ytAccessToken, nextPageToken)
      setPlaylistSongs((prev) => [...(prev ?? []), ...items])
      setNextPageToken(next)
    } catch {
      // silently ignore
    } finally {
      setLoadingMore(false)
    }
  }

  const toggleSongSelection = (ytId) => {
    setSelectedSongIds((prev) => {
      const next = new Set(prev)
      if (next.has(ytId)) next.delete(ytId)
      else next.add(ytId)
      return next
    })
  }

  const handlePickSong = async (song) => {
    if (submittingPlaylist) return
    setSubmittingPlaylist(true)
    const ok = await submitPlaylistSuggestion({ songs: [song] })
    setSubmittingPlaylist(false)
    if (ok) {
      setSubmittedPlaylist(true)
      setSelectedPlaylist(null)
      setPlaylistSongs(null)
      setNextPageToken(null)
      setSelectedSongIds(new Set())
      setTimeout(() => setSubmittedPlaylist(false), 4000)
    }
  }

  const handleImportSelected = async () => {
    if (submittingPlaylist || selectedSongIds.size === 0 || !playlistSongs) return
    setSubmittingPlaylist(true)
    const toImport = playlistSongs.filter((s) => selectedSongIds.has(s.ytId))
    for (const song of toImport) {
      await submitPlaylistSuggestion({ songs: [song] })
    }
    setSubmittingPlaylist(false)
    setSubmittedPlaylist(true)
    setSelectedPlaylist(null)
    setPlaylistSongs(null)
    setNextPageToken(null)
    setSelectedSongIds(new Set())
    setTimeout(() => setSubmittedPlaylist(false), 4000)
  }

  const handleImportAll = async () => {
    if (submittingPlaylist || !selectedPlaylist) return
    setSubmittingPlaylist(true)

    let allSongs = [...(playlistSongs ?? [])]
    let token = nextPageToken
    const isLiked = selectedPlaylist.id === YT_LIKED_PLAYLIST_ID
    while (token) {
      try {
        const { items, nextPageToken: next } = isLiked
          ? await fetchLikedVideosPage(ytAccessToken, token)
          : await fetchYtPlaylistPage(selectedPlaylist.id, ytAccessToken, token)
        allSongs = [...allSongs, ...items]
        token = next
      } catch {
        break
      }
    }

    setImportProgress({ done: 0, total: allSongs.length })
    for (let i = 0; i < allSongs.length; i++) {
      await submitPlaylistSuggestion({ songs: [allSongs[i]] })
      setImportProgress({ done: i + 1, total: allSongs.length })
    }
    setSubmittingPlaylist(false)
    setImportProgress(null)
    setSubmittedPlaylist(true)
    setSelectedPlaylist(null)
    setPlaylistSongs(null)
    setNextPageToken(null)
    setSelectedSongIds(new Set())
    setTimeout(() => setSubmittedPlaylist(false), 4000)
  }

  const handleImportAllDirect = async (playlist) => {
    if (importingPlaylistId) return
    setImportingPlaylistId(playlist.id)
    const isLiked = playlist.id === YT_LIKED_PLAYLIST_ID
    let allSongs = []
    let token = null
    try {
      do {
        const { items, nextPageToken: next } = isLiked
          ? await fetchLikedVideosPage(ytAccessToken, token)
          : await fetchYtPlaylistPage(playlist.id, ytAccessToken, token)
        allSongs = [...allSongs, ...items]
        token = next
      } while (token)
      setImportProgress({ done: 0, total: allSongs.length })
      for (let i = 0; i < allSongs.length; i++) {
        await submitPlaylistSuggestion({ songs: [allSongs[i]] })
        setImportProgress({ done: i + 1, total: allSongs.length })
      }
      setImportProgress(null)
      setSubmittedPlaylist(true)
      setTimeout(() => setSubmittedPlaylist(false), 4000)
    } catch {
      // silently ignore
    } finally {
      setImportingPlaylistId(null)
    }
  }

  const resetSelectedPlaylist = () => {
    setSelectedPlaylist(null)
    setPlaylistSongs(null)
    setNextPageToken(null)
    setSelectedSongIds(new Set())
  }

  return {
    playlists,
    loadingPlaylists,
    selectedPlaylist,
    playlistSongs,
    nextPageToken,
    loadingPlaylistSongs,
    loadingMore,
    submittingPlaylist,
    submittedPlaylist,
    handleSelectPlaylist,
    handleLoadMore,
    handlePickSong,
    handleImportSelected,
    handleImportAll,
    handleImportAllDirect,
    importProgress,
    importingPlaylistId,
    resetSelectedPlaylist,
    selectedSongIds,
    toggleSongSelection,
    likedTotalCount,
  }
}
