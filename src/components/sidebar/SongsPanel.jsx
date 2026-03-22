import { useCallback, useState } from 'react'
import { ScrollText } from '../ScrollText'
import { useLanguage } from '../../context/LanguageContext'

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M6 6.5v4M8 6.5v4M2.5 3.5l.75 8a.5.5 0 0 0 .5.5h6.5a.5.5 0 0 0 .5-.5l.75-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 1.5v1.2M7 11.3v1.2M1.5 7h1.2M11.3 7h1.2M3.4 3.4l.85.85M9.75 9.75l.85.85M10.6 3.4l-.85.85M4.25 9.75l-.85.85" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function SongSettingsModal({ song, onClose, onSave, t }) {
  const [title, setTitle] = useState(song.title)
  const [startOffset, setStartOffset] = useState(song.startOffset ?? 0)

  const handleSave = () => {
    onSave(song.id, {
      title: title.trim() || song.title,
      startOffset: Number(startOffset),
    })
    onClose()
  }

  const addedAtStr = song.addedAt
    ? new Date(song.addedAt).toLocaleString()
    : null
  const addedByStr = song.addedBy?.name || (song.addedBy?.uid ? t('unknownUser') : null)

  return (
    <div className="song-settings-overlay" onClick={onClose}>
      <div className="song-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="song-settings-header">
          <h3 className="song-settings-title">{t('songSettingsTitle')}</h3>
          <button className="song-settings-close" onClick={onClose}>✕</button>
        </div>
        <div className="song-settings-body">
          {song.ytId && (
            <img
              src={`https://img.youtube.com/vi/${song.ytId}/mqdefault.jpg`}
              alt=""
              className="song-settings-thumb"
            />
          )}
          <label className="song-settings-label">{t('songTitleLabel')}</label>
          <input
            className="song-settings-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="song-settings-label">
            {t('startOffsetLabel')}: <strong>{startOffset}s</strong>
          </label>
          <input
            type="range"
            className="song-settings-slider"
            min="0"
            max="30"
            step="1"
            value={startOffset}
            onChange={(e) => setStartOffset(e.target.value)}
          />
          <div className="song-settings-info-row">
            <span className="song-settings-info-label">{t('addedAtLabel')}</span>
            <span className="song-settings-info-value">{addedAtStr ?? t('notAvailable')}</span>
          </div>
          <div className="song-settings-info-row">
            <span className="song-settings-info-label">{t('addedByLabel')}</span>
            <span className="song-settings-info-value">{addedByStr ?? t('notAvailable')}</span>
          </div>
        </div>
        <div className="song-settings-footer">
          <button className="song-settings-save" onClick={handleSave}>{t('save')}</button>
        </div>
      </div>
    </div>
  )
}

export function SongsPanel({
  room,
  isPlaying,
  currentSong,
  playSongNow,
  deleteSong,
  deleteSongs,
  updateSong,
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
  const [editingSong, setEditingSong] = useState(null)

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
                  <button className="btn-icon" onClick={(event) => { event.stopPropagation(); setEditingSong(song) }} title={t('songSettings')}><GearIcon /></button>
                  <button className="btn-icon danger" onClick={(event) => { event.stopPropagation(); if (window.confirm(t('confirmDeleteSong', song.title))) deleteSong(song.id) }} title={t('deleteSongBtn')}><TrashIcon /></button>
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
      {editingSong && (
        <SongSettingsModal
          song={editingSong}
          onClose={() => setEditingSong(null)}
          onSave={updateSong}
          t={t}
        />
      )}
    </div>
  )
}
