import { useCallback, useState } from 'react'
import { ScrollText } from '../ScrollText'
import { useLanguage } from '../../context/LanguageContext'

export function SongsPanel({
  room,
  isPlaying,
  currentSong,
  playSongNow,
  deleteSong,
  deleteSongs,
  showThumbnails,
  queueSong,
  canEditRoom,
  isViewMode,
  onLocalPlay,
  localCurrentSongId,
}) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const toggleBulkDelete = useCallback(() => {
    setBulkDeleteMode((prev) => !prev)
    setSelectedIds(new Set())
  }, [])

  const toggleSelectSong = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(t('confirmDeleteN', selectedIds.size))) return
    await deleteSongs([...selectedIds])
    setSelectedIds(new Set())
    setBulkDeleteMode(false)
  }, [deleteSongs, selectedIds, t])

  const songs = room?.songs ?? []
  const filteredSongs = searchQuery.trim()
    ? songs.filter((song) => song.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : songs

  return (
    <div className="section songs-section">
      <div className="sidebar-search-bar">
        <input
          className="sidebar-search-input"
          type="text"
          placeholder={t('searchSongs')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        {searchQuery && (
          <button className="sidebar-search-clear" onClick={() => setSearchQuery('')} title={t('clearSearch')}>x</button>
        )}
        {canEditRoom && (
          <button
            className={`sidebar-bulk-delete-toggle${bulkDeleteMode ? ' active' : ''}`}
            onClick={toggleBulkDelete}
            title={bulkDeleteMode ? t('cancelDeletion') : t('selectToDelete')}
          >
            {bulkDeleteMode ? t('cancel') : t('deleteMore')}
          </button>
        )}
      </div>
      <div className="songs-content">
        <div className="song-list">
          {filteredSongs.map((song) => (
            <div
              key={song.id}
              className={`song-item${(canEditRoom && currentSong?.id === song.id && isPlaying) || (isViewMode && localCurrentSongId === song.id) ? ' song-playing' : ''}${!bulkDeleteMode && (canEditRoom || isViewMode) ? ' song-item-clickable' : ''}${bulkDeleteMode ? ' song-item-selectable' : ''}${bulkDeleteMode && selectedIds.has(song.id) ? ' song-item-selected' : ''}`}
              onClick={
                bulkDeleteMode
                  ? () => toggleSelectSong(song.id)
                  : canEditRoom
                    ? () => playSongNow(song)
                    : isViewMode
                      ? () => onLocalPlay(song)
                      : undefined
              }
            >
              {bulkDeleteMode && (
                <input
                  type="checkbox"
                  className="song-select-checkbox"
                  checked={selectedIds.has(song.id)}
                  onChange={() => toggleSelectSong(song.id)}
                  onClick={(event) => event.stopPropagation()}
                />
              )}
              {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />}
              <div className="song-title-col">
                <ScrollText className="song-title">{song.title}</ScrollText>
                {song.addedBy && (
                  <span className="song-added-by">{song.addedBy.name || t('guestName')}</span>
                )}
              </div>
              {!bulkDeleteMode && canEditRoom && (
                <>
                  <button className="btn-icon queue-add" onClick={(event) => { event.stopPropagation(); queueSong(song) }} title={t('addToList')}>+</button>
                  <button className="btn-icon danger" onClick={(event) => { event.stopPropagation(); if (window.confirm(t('confirmDeleteSong', song.title))) deleteSong(song.id) }} title={t('reject')}>x</button>
                </>
              )}
            </div>
          ))}
          {searchQuery && filteredSongs.length === 0 && (
            <p className="sidebar-search-empty">{t('noResultsFor')} "{searchQuery}"</p>
          )}
        </div>
        {bulkDeleteMode && (
          <div className="bulk-delete-bar">
            <span className="bulk-delete-count">{selectedIds.size} {t('selectedCount')}</span>
            <button
              className="bulk-delete-confirm"
              onClick={handleBulkDelete}
              disabled={selectedIds.size === 0}
            >
              {t('deleteSelected')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
