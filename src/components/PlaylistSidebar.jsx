import { useState, useCallback } from 'react'
import { ContactMessageForm } from './ContactMessageForm'
import { NotePicker } from './NotePicker'
import { ScrollText } from './ScrollText'
import { useLanguage } from '../context/LanguageContext'

const IconPlay = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)

export function PlaylistSidebar({
  leftPanel,
  isPlaying,
  room,
  currentSong,
  playSongNow,
  deleteSong,
  deleteSongs,
  suggestions,
  approveSuggestion,
  rejectSuggestion,
  showThumbnails,
  queue,
  voteThreshold,
  voteMode,
  skipThreshold,
  allowSuggestions,
  allowGuestListening,
  tickerText,
  tickerOnScreen,
  tickerForGuests,
  queueSize,
  saveSettings,
  importPlaylist,
  exportPlaylist,
  queueSong,
  removeFromQueue,
  copyAdminLink,
  copied,
  roomType,
  onRenameRoom,
  showQr,
  showQueueOverlay,
  showRoomCode,
  onToggleQr,
  onToggleQueueOverlay,
  onToggleShowRoomCode,
  isVisible,
  canEditRoom,
  isViewMode,
  onLocalPlay,
  localCurrentSongId,
  onSubmitMessage,
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

  const handleImportChange = async (event) => {
    const [file] = event.target.files ?? []
    if (file) await importPlaylist(file)
    event.target.value = ''
  }

  const handleRoomNameSave = (value) => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== room?.name) onRenameRoom(trimmed)
  }

  const songs = room?.songs ?? []
  const filteredSongs = searchQuery.trim()
    ? songs.filter((song) => song.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : songs

  return (
    <aside className={`sidebar${leftPanel ? '' : ' sidebar-hidden'}`}>
      {leftPanel === 'songs' && room && (
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
      )}

      {leftPanel === 'queue' && (
        <div className="section songs-section">
          <div className="sidebar-queue-header">
            <h2 className="section-title">{t('queueHeader')}</h2>
            <div className="sidebar-queue-threshold">
              <span className="panel-header-label">{t('minQueued')}</span>
              <div className="note-picker note-picker-sm">
                {[0, 1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    className={`note-btn${voteThreshold === count ? ' active' : ''}`}
                    onClick={() => saveSettings('voteThreshold', count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {isPlaying && queue.length > 0 ? (
            <ol className="queue-list">
              {queue.map((song, index) => (
                <li key={song.id} className="queue-item">
                  <span className="queue-pos">{index + 1}</span>
                  {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-thumb" />}
                  <ScrollText className="queue-title">{song.title}</ScrollText>
                  {canEditRoom && <button className="btn-icon play" onClick={() => playSongNow(song)} title={t('playNow')}><IconPlay /></button>}
                  {canEditRoom && <button className="btn-icon danger" onClick={() => removeFromQueue(song.id)} title={t('removeFromQueue')}><IconTrash /></button>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="sidebar-queue-empty">{isPlaying ? t('queueEmpty') : t('playbackStopped')}</p>
          )}
        </div>
      )}

      {leftPanel === 'settings' && suggestions?.length > 0 && (
        <div className="section">
          <div className="section-title-row">
            <h2 className="section-title">{t('suggestionsHeader')} <span className="count">{suggestions.length}</span></h2>
          </div>
          <div className="suggestions-list">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="suggestion-item">
                {showThumbnails && <img src={`https://img.youtube.com/vi/${suggestion.ytId}/default.jpg`} alt="" className="song-thumb" />}
                <span className="song-title">{suggestion.title}</span>
                <div className="suggestion-actions">
                  <button className="btn-icon play" onClick={() => approveSuggestion(suggestion)} title={t('addToList')}>OK</button>
                  <button className="btn-icon danger" onClick={() => rejectSuggestion(suggestion.id)} title={t('reject')}>x</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {leftPanel === 'settings' && (
        <div className="section sidebar-settings-list">
          <div className="settings-group">
            <span className="settings-group-title">{t('votingOptionsGroup')}</span>

            <div className="setting-row">
              <span className="setting-label">{t('voteType')}</span>
              <div className="setting-toggle-group">
                <button className={`btn-setting${voteMode === 'highest' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'highest')} disabled={!canEditRoom}>Top</button>
                <button className={`btn-setting${voteMode === 'weighted' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'weighted')} disabled={!canEditRoom}>%</button>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('songsPerGroup')}</span>
              <NotePicker value={queueSize} onChange={(value) => canEditRoom && saveSettings('queueSize', value)} />
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('minQueuedLabel')}</span>
              <div className="note-picker note-picker-sm">
                {[0, 1, 2, 3, 4].map((count) => (
                  <button key={count} className={`note-btn${voteThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('voteThreshold', count)} disabled={!canEditRoom}>
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('skipVotesRequired')}</span>
              <input
                className="setting-number-input"
                type="number"
                min="0"
                max="99"
                value={skipThreshold}
                onChange={(event) => saveSettings('skipThreshold', Math.max(0, parseInt(event.target.value, 10) || 0))}
                disabled={!canEditRoom}
              />
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('guestSuggestions')}</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!allowSuggestions} onChange={(event) => saveSettings('allowSuggestions', event.target.checked)} disabled={!canEditRoom} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('guestListening')}</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!allowGuestListening} onChange={(event) => saveSettings('allowGuestListening', event.target.checked)} disabled={!canEditRoom} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div className="settings-group">
            <span className="settings-group-title">{t('displayGroup')}</span>

            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
              <span className="setting-label">{t('textTicker')}</span>
              <input
                className="setting-ticker-input"
                type="text"
                placeholder={t('tickerPlaceholder')}
                value={tickerText}
                onChange={(event) => saveSettings('tickerText', event.target.value)}
                disabled={!canEditRoom}
              />
              <div className="setting-toggle-group">
                <button className={`btn-setting${tickerOnScreen ? ' active' : ''}`} onClick={() => saveSettings('tickerOnScreen', !tickerOnScreen)} disabled={!canEditRoom}>{t('onScreen')}</button>
                <button className={`btn-setting${tickerForGuests ? ' active' : ''}`} onClick={() => saveSettings('tickerForGuests', !tickerForGuests)} disabled={!canEditRoom}>{t('forGuests')}</button>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('thumbnails')}</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!showThumbnails} onChange={(event) => saveSettings('showThumbnails', event.target.checked)} disabled={!canEditRoom} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('showQrCode')}</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!showQr} onChange={onToggleQr} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('showRoomCode')}</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!showRoomCode} onChange={onToggleShowRoomCode} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('showQueueOverlay')}</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!showQueueOverlay} onChange={onToggleQueueOverlay} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div className="settings-group">
            <span className="settings-group-title">{t('roomOptionsGroup')}</span>

            <div className="setting-row">
              <span className="setting-label">{t('nameSetting')}</span>
              <input
                className="setting-rename-input"
                key={room?.id ?? 'room-name'}
                defaultValue={room?.name ?? ''}
                onBlur={(event) => handleRoomNameSave(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && event.target.blur()}
                placeholder={t('roomNamePlaceholder')}
                disabled={!canEditRoom}
              />
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('roomVisibility')}</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={isVisible !== false} onChange={(event) => saveSettings('isVisible', event.target.checked)} disabled={!canEditRoom} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row setting-row--stats">
              {(() => {
                const ratingsMap = room?.ratings ?? {}
                const ratingValues = Object.values(ratingsMap)
                const ratingCount = ratingValues.length
                const avgRating = ratingCount > 0
                  ? (ratingValues.reduce((sum, value) => sum + value, 0) / ratingCount).toFixed(1)
                  : '-'

                return (
                  <div className="settings-stats">
                    <div className="settings-stat">
                      <span className="settings-stat-value">{avgRating}</span>
                      <span className="settings-stat-label">{t('ratingLabel')}{ratingCount > 0 ? ` (${ratingCount} ${t('votesCount')})` : ''}</span>
                    </div>
                    <div className="settings-stat">
                      <span className="settings-stat-value">{room?.totalPlays ?? 0}</span>
                      <span className="settings-stat-label">{t('playsLabel')}</span>
                    </div>
                    <div className="settings-stat">
                      <span className="settings-stat-value">{room?.totalVotes ?? 0}</span>
                      <span className="settings-stat-label">{t('votesLabel')}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {canEditRoom && (
              <div className="setting-row">
                <button className="btn-setting-action" style={{ flex: 1 }} onClick={copyAdminLink}>
                  {copied === 'admin' ? t('copiedLink') : roomType === 'public' ? t('copyRoomLink') : t('copyAdminLink')}
                </button>
              </div>
            )}

            <div className="setting-row setting-row--import-export">
              <button className="btn-setting-action" style={{ flex: 1 }} onClick={exportPlaylist}>{t('exportBtn')}</button>
              {canEditRoom && (
                <label className="btn-setting-action btn-file" style={{ flex: 1 }}>
                  {t('importBtn')}
                  <input type="file" accept="application/json,.json" onChange={handleImportChange} />
                </label>
              )}
            </div>

            <div className="setting-row setting-row--message">
              <ContactMessageForm
                triggerClassName="btn-setting-action"
                triggerLabel={t('writeMessageSidebar')}
                title={t('writeMessageAboutRoom')}
                description={t('noteOrBugOrIdea')}
                successMessage={t('messageSaved')}
                submitLabel={t('sendMessage')}
                panelClassName="settings-contact-form"
                onSubmit={(payload) => onSubmitMessage({ ...payload, source: 'guest_room', roomId: room?.id ?? null })}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
