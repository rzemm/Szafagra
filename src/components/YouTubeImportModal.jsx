import { useEffect, useState } from 'react'
import { useLanguage } from '../context/useLanguage'
import { fetchUserYtPlaylists, fetchYtPlaylistPage, fetchLikedVideosPage, YT_LIKED_PLAYLIST_ID } from '../lib/youtube'
import { ScrollText } from './ScrollText'

export function YouTubeImportModal({ accessToken, onClose, onCreateRoom, onAddToRoom, onPickSong, currentRoomId, ownedRooms = [] }) {
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
  const [showRoomPicker, setShowRoomPicker] = useState(false)

  const currentRoom = ownedRooms.find((r) => r.id === currentRoomId) ?? null
  const otherRooms = ownedRooms.filter((r) => r.id !== currentRoomId)

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
    setShowRoomPicker(false)
    setLoadingSongs(true)
    const isLiked = playlist.id === YT_LIKED_PLAYLIST_ID
    try {
      const { items, nextPageToken: next } = isLiked
        ? await fetchLikedVideosPage(accessToken)
        : await fetchYtPlaylistPage(playlist.id, accessToken)
      setSongs(items)
      setNextPageToken(next)
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

  const handlePickSong = async (song) => {
    if (busy) return
    setBusy(true)
    if (onPickSong) {
      await onPickSong(song)
    } else if (currentRoom) {
      await onAddToRoom(currentRoom.id, [song])
    } else {
      await onCreateRoom(song.title, [song])
    }
    setBusy(false)
  }

  const handleCreate = async () => {
    if (!selected || !songs || busy) return
    setBusy(true)
    const title = selected.id === YT_LIKED_PLAYLIST_ID ? t('ytLikedVideos') : selected.title
    await onCreateRoom(title, songs)
  }

  const handleAddTo = async (roomId) => {
    if (!songs || busy) return
    setBusy(true)
    await onAddToRoom(roomId, songs)
  }

  const handleBack = () => {
    setSelected(null)
    setSongs(null)
    setNextPageToken(null)
    setSongsError(null)
    setShowRoomPicker(false)
  }

  return (
    <div className="ytimport-overlay" role="presentation" onClick={onClose}>
      <div
        className="ytimport-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('ytImportTitle')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ytimport-header">
          <span className="ytimport-title">{t('ytImportTitle')}</span>
          <button className="ytimport-close" onClick={onClose} aria-label={t('closeModal')}>✕</button>
        </div>

        <div className="ytimport-body">
          {selected ? (
            <div className="ytimport-detail">
              <button className="ytimport-back" onClick={handleBack}>
                ← {t('ytImportBack')}
              </button>
              <div className="ytimport-detail-card">
                {selected.thumbnail && (
                  <img src={selected.thumbnail} alt="" className="ytimport-detail-thumb" />
                )}
                <div className="ytimport-detail-info">
                  <div className="ytimport-detail-name">
                    {selected.id === YT_LIKED_PLAYLIST_ID ? t('ytLikedVideos') : selected.title}
                  </div>
                  {loadingSongs && (
                    <div className="ytimport-status">{t('ytImportFetchingSongs')}</div>
                  )}
                  {songsError && (
                    <div className="ytimport-error">{songsError}</div>
                  )}
                  {songs && (
                    <div className="ytimport-detail-count">
                      {t('ytImportSongCount', songs.length)}{nextPageToken ? '+' : ''}
                    </div>
                  )}
                </div>
              </div>

              {songs && songs.length === 0 && (
                <div className="ytimport-status">{t('ytImportEmpty')}</div>
              )}

              {songs && songs.length > 0 && (
                <>
                  <div className="ytimport-songs-list">
                    {songs.map((song) => (
                      <button
                        key={song.ytId}
                        className="song-item song-item-clickable"
                        onClick={() => handlePickSong(song)}
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
                  {playlists.map((pl) => (
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
                        <div className="ytimport-item-title">
                          {pl.id === YT_LIKED_PLAYLIST_ID ? t('ytLikedVideos') : pl.title}
                        </div>
                        <div className="ytimport-item-count">
                          {pl.itemCount != null ? `${pl.itemCount} ${t('ytImportVideos')}` : ''}
                        </div>
                      </div>
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
