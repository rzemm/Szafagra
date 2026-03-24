import { useEffect, useState } from 'react'
import { fetchUserYtPlaylists, fetchYtPlaylistItems } from '../lib/youtube'

export function useGuestPlaylistSuggestion({ ytAccessToken, submitPlaylistSuggestion }) {
  const [playlists, setPlaylists] = useState(null)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistSongs, setPlaylistSongs] = useState(null)
  const [loadingPlaylistSongs, setLoadingPlaylistSongs] = useState(false)
  const [submittingPlaylist, setSubmittingPlaylist] = useState(false)
  const [submittedPlaylist, setSubmittedPlaylist] = useState(false)

  useEffect(() => {
    if (!ytAccessToken) return

    setPlaylists(null)
    setSelectedPlaylist(null)
    setPlaylistSongs(null)
    setLoadingPlaylists(true)

    fetchUserYtPlaylists(ytAccessToken)
      .then((data) => {
        setPlaylists(data)
        setLoadingPlaylists(false)
      })
      .catch(() => setLoadingPlaylists(false))
  }, [ytAccessToken])

  const handleSelectPlaylist = async (playlist) => {
    setSelectedPlaylist(playlist)
    setPlaylistSongs(null)
    setLoadingPlaylistSongs(true)

    try {
      const items = await fetchYtPlaylistItems(playlist.id, ytAccessToken)
      setPlaylistSongs(items)
    } catch {
      setPlaylistSongs([])
    } finally {
      setLoadingPlaylistSongs(false)
    }
  }

  const handleSubmitPlaylist = async () => {
    if (!selectedPlaylist || !playlistSongs || submittingPlaylist) return

    setSubmittingPlaylist(true)
    const ok = await submitPlaylistSuggestion({
      playlistTitle: selectedPlaylist.title,
      playlistId: selectedPlaylist.id,
      songs: playlistSongs,
    })
    setSubmittingPlaylist(false)

    if (ok) {
      setSubmittedPlaylist(true)
      setSelectedPlaylist(null)
      setPlaylistSongs(null)
      setTimeout(() => setSubmittedPlaylist(false), 4000)
    }
  }

  const resetSelectedPlaylist = () => {
    setSelectedPlaylist(null)
    setPlaylistSongs(null)
  }

  return {
    playlists,
    loadingPlaylists,
    selectedPlaylist,
    playlistSongs,
    loadingPlaylistSongs,
    submittingPlaylist,
    submittedPlaylist,
    handleSelectPlaylist,
    handleSubmitPlaylist,
    resetSelectedPlaylist,
  }
}
