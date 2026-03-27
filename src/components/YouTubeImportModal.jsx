import { useEffect, useState } from 'react'
import { useLanguage } from '../context/useLanguage'
import { fetchUserYtPlaylists, fetchYtPlaylistPage, fetchLikedVideosPage, YT_LIKED_PLAYLIST_ID } from '../lib/youtube'
import { ScrollText } from './ScrollText'

export function YouTubeImportModal({ accessToken, onClose, onCreateRoom, onAddToRoom, onPickSong, onImportAllSongs, currentRoomId, ownedRooms = [], existingYtIds = new Set() }) {
  const { t } = useLanguage()
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

  const currentRoom = ownedRooms.find((r) => r.id === currentRoomId) ?? null
  const isLikedView = selected?.id === YT_LIKED_PLAYLIST_ID

  useEffect(() => {
    fetchUserYtPlaylists(accessToken)
      .then((data) => { setPlaylists(data); setLoadingPlaylists(false) })
      .catch((err) => { setPlaylistsError(err.message); setLoadingPlaylists(false) })
  }, [accessToken])

  const handleSelect = async (playlist) => {
    setSelected(playlist)
    setSongs(null)
    setNextPageToken(null)
    setSongsError(null)
    setLoadingSongs(true)
    setSelectedSongIds(new Set())
    setLikedTotalCount(null)
    const isLiked = playlist.id === YT_LIKED_PLAYLIST_ID
    try {
      const { items, nextPageToken: next, totalResults } = isLiked
        ? await fetchLikedVideosPage(accessToken)
        : await fetchYtPlaylistPage(playlist.id, accessToken)
      setSongs(items)
      setNextPageToken(next)
      if (isLiked && totalResults != null) setLikedTotalCount(totalResults)
    } catch (err) {
      setSongsError(err.message)
    } finally {
      setLoadingSongs(false)
    }
  }

  const handleLoadMore = async () => {
    if (!nextPageToken || !selected || loadingMore) return
    setLoadingMore(true)
    const isLiked = selected.id === YT_LIKED_PLAYLIST_ID
    try {
      const { items, nextPageToken: next } = isLiked
        ? await fetchLikedVideosPage(accessToken, nextPageToken)
        : await fetchYtPlaylistPage(selected.id, accessToken, nextPageToken)
      setSongs((prev) => [...(prev ?? []), ...items])
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

  const handleImportSelected = async () => {
    if (busy || selectedSongIds.size === 0 || !songs || !onImportAllSongs) return
    setBusy(true)
    const toImport = songs.filter((s) => selectedSongIds.has(s.ytId))
    await onImportAllSongs(toImport)
    setBusy(false)
    setSelectedSongIds(new Set())
    onClose()
  }

  const handleImportAll = async () => {
    if (busy || !selected || !onImportAllSongs) return
    setBusy(true)
    const isLiked = selected.id === YT_LIKED_PLAYLIST_ID
    let allSongs = [...(songs ?? [])]
    let token = nextPageToken
    while (token) {
      try {
        const { items, nextPageToken: next } = isLiked
          ? await fetchLikedVideosPage(accessToken, token)
          : await fetchYtPlaylistPage(selected.id, accessToken, token)
        allSongs = [...allSongs, ...items]
        token = next
      } catch {
        break
      }
    }
    await onImportAllSongs(allSongs)
    setBusy(false)
    onClose()
  }

  const handleImportAllDirect = async (playlist, e) => {
    e.stopPropagation()
    if (importingPlaylistId || !onImportAllSongs) return
    setImportingPlaylistId(playlist.id)
    const isLiked = playlist.id === YT_LIKED_PLAYLIST_ID
    let allSongs = []
    let token = null
    try {
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
      // silently ignore
    } finally {
      setImportingPlaylistId(null)
    }
  }

  const handleBack = () => {
    setSelected(null)
    setSongs(null)
    setNextPageToken(null)
    setSongsError(null)
    setSelectedSongIds(new Set())
  }

  const countLabel = isLikedView
    ? likedTotalCount != null ? ` (${likedTotalCount})` : songs != null ? ` (${songs.length}${nextPageToken ? '+' : ''})` : ''
    : selected != null ? (selected.itemCount != null ? ` (${selected.itemCount})` : songs != null ? ` (${songs.length}${nextPageToken ? '+' : ''})` : '') : ''

  const headerTitle = selected
    ? isLikedView
      ? `${t('ytImportFromLiked')}${countLabel}`
      : `${selected.title}${countLabel}`
    : t('ytImportTitle')

  const regularPlaylists = playlists ? playlists.filter((pl) => pl.id !== YT_LIKED_PLAYLIST_ID) : []
  const likedPlaylist = playlists ? playlists.find((pl) => pl.id === YT_LIKED_PLAYLIST_ID) : null

  return (
    <div className="ytimport-overlay" role="presentation" onClick={onClose}>
      <div
        className="ytimport-modal"
        role="dialog"
        aria-modal="true"
        aria-label={headerTitle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ytimport-header">
          <span className="ytimport-title">{headerTitle}</span>
          <button className="ytimport-close" onClick={onClose} aria-label={t('closeModal')}>✕</button>
        </div>

        <div className="ytimport-body">
          {selected ? (
            <div className="ytimport-detail">
              <div className="ytimport-detail-nav">
                <button className="ytimport-back" onClick={handleBack}>
                  ← {t('ytImportBack')}
                </button>
                {selectedSongIds.size > 0 && (
                  <button
                    className="ytimport-action-btn ytimport-action-btn--primary ytimport-import-selected-btn"
                    onClick={handleImportSelected}
                    disabled={busy}
                  >
                    {t('ytImportSelected', selectedSongIds.size)}
                  </button>
                )}
              </div>

              {loadingSongs && (
                <div className="ytimport-status">{t('ytImportFetchingSongs')}</div>
              )}
              {songsError && (
                <div className="ytimport-error">{songsError}</div>
              )}

              {songs && songs.length === 0 && (
                <div className="ytimport-status">{t('ytImportEmpty')}</div>
              )}

              {songs && songs.length > 0 && (
                <>
                  {!isLikedView && onImportAllSongs && (
                    <button className="ytimport-action-btn" onClick={handleImportAll} disabled={busy}>
                      {busy ? '...' : t('ytImportAll')}
                    </button>
                  )}
                  <div className="ytimport-songs-list">
                    {songs.map((song) => (
                      <button
                        key={song.ytId}
                        className={`song-item song-item-clickable${selectedSongIds.has(song.ytId) ? ' song-item--selected' : ''}${existingYtIds.has(song.ytId) ? ' song-item--exists' : ''}`}
                        onClick={() => !existingYtIds.has(song.ytId) && toggleSongSelection(song.ytId)}
                        disabled={busy}
                      >
                        <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />
                        <div className="song-title-col">
                          <ScrollText className="song-title">{song.title}</ScrollText>
                        </div>
                      </button>
                    ))}
                  </div>
                  {nextPageToken && (
                    <button className="ytimport-action-btn ytimport-action-btn--subtle" onClick={handleLoadMore} disabled={loadingMore}>
                      {loadingMore ? '...' : t('loadMore')}
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {loadingPlaylists && (
                <div className="ytimport-status">{t('ytImportLoading')}</div>
              )}
              {playlistsError && (
                <div className="ytimport-error">{playlistsError}</div>
              )}
              {playlists && playlists.length === 0 && (
                <div className="ytimport-status">{t('ytImportNoPlaylists')}</div>
              )}
              {playlists && playlists.length > 0 && (
                <ul className="ytimport-list">
                  {likedPlaylist && (
                    <li
                      key={likedPlaylist.id}
                      className="ytimport-item"
                      onClick={() => handleSelect(likedPlaylist)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelect(likedPlaylist)}
                    >
                      {likedPlaylist.thumbnail ? (
                        <img src={likedPlaylist.thumbnail} alt="" className="ytimport-thumb" />
                      ) : (
                        <div className="ytimport-thumb ytimport-thumb--empty" />
                      )}
                      <div className="ytimport-item-info">
                        <div className="ytimport-item-title">{t('ytLikedVideos')}</div>
                        <div className="ytimport-item-count">
                          {likedPlaylist.itemCount != null ? `${likedPlaylist.itemCount} ${t('ytImportVideos')}` : ''}
                        </div>
                      </div>
                    </li>
                  )}
                  {likedPlaylist && regularPlaylists.length > 0 && (
                    <li className="ytimport-list-separator" aria-hidden="true">
                      {t('ytImportPlaylists')}
                    </li>
                  )}
                  {regularPlaylists.map((pl) => (
                    <li
                      key={pl.id}
                      className="ytimport-item"
                      onClick={() => handleSelect(pl)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelect(pl)}
                    >
                      {pl.thumbnail ? (
                        <img src={pl.thumbnail} alt="" className="ytimport-thumb" />
                      ) : (
                        <div className="ytimport-thumb ytimport-thumb--empty" />
                      )}
                      <div className="ytimport-item-info">
                        <div className="ytimport-item-title">{pl.title}</div>
                        <div className="ytimport-item-count">
                          {pl.itemCount != null ? `${pl.itemCount} ${t('ytImportVideos')}` : ''}
                        </div>
                      </div>
                      {onImportAllSongs && (
                        <button
                          className="ytimport-item-import-btn"
                          onClick={(e) => handleImportAllDirect(pl, e)}
                          disabled={!!importingPlaylistId}
                        >
                          {importingPlaylistId === pl.id ? '...' : t('ytImportAllList')}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
