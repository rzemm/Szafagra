import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { fetchUserYtPlaylists, fetchYtPlaylistItems } from '../lib/youtube'

export function YouTubeImportModal({ accessToken, onClose, onCreateRoom, onAddToRoom, currentRoomId, ownedRooms = [] }) {
  const { t } = useLanguage()
  const [playlists, setPlaylists] = useState(null)
  const [loadingPlaylists, setLoadingPlaylists] = useState(true)
  const [playlistsError, setPlaylistsError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [songs, setSongs] = useState(null)
  const [loadingSongs, setLoadingSongs] = useState(false)
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
    setSongsError(null)
    setShowRoomPicker(false)
    setLoadingSongs(true)
    try {
      const items = await fetchYtPlaylistItems(playlist.id, accessToken)
      setSongs(items)
    } catch (err) {
      setSongsError(err.message)
    } finally {
      setLoadingSongs(false)
    }
  }

  const handleCreate = async () => {
    if (!selected || !songs || busy) return
    setBusy(true)
    await onCreateRoom(selected.title, songs)
  }

  const handleAddTo = async (roomId) => {
    if (!songs || busy) return
    setBusy(true)
    await onAddToRoom(roomId, songs)
  }

  const handleBack = () => {
    setSelected(null)
    setSongs(null)
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
                  <div className="ytimport-detail-name">{selected.title}</div>
                  {loadingSongs && (
                    <div className="ytimport-status">{t('ytImportFetchingSongs')}</div>
                  )}
                  {songsError && (
                    <div className="ytimport-error">{songsError}</div>
                  )}
                  {songs && (
                    <div className="ytimport-detail-count">
                      {t('ytImportSongCount', songs.length)}
                    </div>
                  )}
                </div>
              </div>

              {songs && songs.length === 0 && (
                <div className="ytimport-status">{t('ytImportEmpty')}</div>
              )}

              {songs && songs.length > 0 && (
                <div className="ytimport-actions">
                  <button
                    className="ytimport-action-btn ytimport-action-btn--primary"
                    onClick={handleCreate}
                    disabled={busy}
                  >
                    {busy ? t('creating') : t('ytImportCreate')}
                  </button>

                  {currentRoom && (
                    <button
                      className="ytimport-action-btn"
                      onClick={() => handleAddTo(currentRoom.id)}
                      disabled={busy}
                    >
                      {t('ytImportAddToCurrent')}: <em>{currentRoom.name}</em>
                    </button>
                  )}

                  {otherRooms.length > 0 && (
                    <div className="ytimport-room-picker">
                      <button
                        className="ytimport-action-btn ytimport-action-btn--subtle"
                        onClick={() => setShowRoomPicker((v) => !v)}
                        disabled={busy}
                      >
                        {t('ytImportAddToOther')} {showRoomPicker ? '▲' : '▼'}
                      </button>
                      {showRoomPicker && (
                        <ul className="ytimport-room-list">
                          {otherRooms.map((r) => (
                            <li
                              key={r.id}
                              className="ytimport-room-item"
                              onClick={() => handleAddTo(r.id)}
                            >
                              {r.name || t('defaultRoomName')}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
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
                        <div className="ytimport-item-title">{pl.title}</div>
                        <div className="ytimport-item-count">
                          {pl.itemCount} {t('ytImportVideos')}
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
