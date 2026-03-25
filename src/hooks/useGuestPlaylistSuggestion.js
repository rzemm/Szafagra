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
    const isLiked = playlist.id === YT_LIKED_PLAYLIST_ID
    try {
      const { items, nextPageToken: next } = isLiked
        ? await fetchLikedVideosPage(ytAccessToken)
        : await fetchYtPlaylistPage(playlist.id, ytAccessToken)
      setPlaylistSongs(items)
      setNextPageToken(next)
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
      setTimeout(() => setSubmittedPlaylist(false), 4000)
    }
  }

  const resetSelectedPlaylist = () => {
    setSelectedPlaylist(null)
    setPlaylistSongs(null)
    setNextPageToken(null)
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
    resetSelectedPlaylist,
  }
}
