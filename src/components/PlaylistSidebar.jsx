import { useState } from 'react'
import { ContactMessageForm } from './ContactMessageForm'
import { NotePicker } from './NotePicker'
import { ScrollText } from './ScrollText'

export function PlaylistSidebar({
  leftPanel,
  isPlaying,
  room,
  currentSong,
  playSongNow,
  deleteSong,
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
  const [searchQuery, setSearchQuery] = useState('')

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
              placeholder="Szukaj piosenek..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <button className="sidebar-search-clear" onClick={() => setSearchQuery('')} title="Wyczysc">x</button>
            )}
          </div>
          <div className="songs-content">
            <div className="song-list">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className={`song-item${(canEditRoom && currentSong?.id === song.id && isPlaying) || (isViewMode && localCurrentSongId === song.id) ? ' song-playing' : ''}${canEditRoom || isViewMode ? ' song-item-clickable' : ''}`}
                  onClick={canEditRoom ? () => playSongNow(song) : isViewMode ? () => onLocalPlay(song) : undefined}
                >
                  {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />}
                  <span className="song-title">{song.title}</span>
                  {canEditRoom && (
                    <>
                      <button className="btn-icon queue-add" onClick={(event) => { event.stopPropagation(); queueSong(song) }} title="Dodaj do kolejki">+</button>
                      <button className="btn-icon danger" onClick={(event) => { event.stopPropagation(); if (window.confirm(`Usun "${song.title}"?`)) deleteSong(song.id) }} title="Usun">x</button>
                    </>
                  )}
                </div>
              ))}
              {searchQuery && filteredSongs.length === 0 && (
                <p className="sidebar-search-empty">Brak wynikow dla "{searchQuery}"</p>
              )}
            </div>
          </div>
        </div>
      )}

      {leftPanel === 'queue' && (
        <div className="section songs-section">
          <div className="sidebar-queue-header">
            <h2 className="section-title">Kolejka</h2>
            <div className="sidebar-queue-threshold">
              <span className="panel-header-label">Min. zakolejkowanych:</span>
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
                  {canEditRoom && <button className="btn-icon play" onClick={() => playSongNow(song)}>Play</button>}
                  {canEditRoom && <button className="btn-icon danger" onClick={() => removeFromQueue(song.id)} title="Usun z kolejki">x</button>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="sidebar-queue-empty">{isPlaying ? 'Kolejka jest pusta' : 'Odtwarzanie zatrzymane'}</p>
          )}
        </div>
      )}

      {leftPanel === 'settings' && suggestions?.length > 0 && (
        <div className="section">
          <div className="section-title-row">
            <h2 className="section-title">Propozycje <span className="count">{suggestions.length}</span></h2>
          </div>
          <div className="suggestions-list">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="suggestion-item">
                {showThumbnails && <img src={`https://img.youtube.com/vi/${suggestion.ytId}/default.jpg`} alt="" className="song-thumb" />}
                <span className="song-title">{suggestion.title}</span>
                <div className="suggestion-actions">
                  <button className="btn-icon play" onClick={() => approveSuggestion(suggestion)} title="Dodaj do listy">OK</button>
                  <button className="btn-icon danger" onClick={() => rejectSuggestion(suggestion.id)} title="Odrzuc">x</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {leftPanel === 'settings' && (
        <div className="section sidebar-settings-list">
          <div className="settings-group">
            <span className="settings-group-title">Glosowanie</span>

            <div className="setting-row">
              <span className="setting-label">Rodzaj glosowania</span>
              <div className="setting-toggle-group">
                <button className={`btn-setting${voteMode === 'highest' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'highest')} disabled={!canEditRoom}>Top</button>
                <button className={`btn-setting${voteMode === 'weighted' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'weighted')} disabled={!canEditRoom}>%</button>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Utworow w grupie</span>
              <NotePicker value={queueSize} onChange={(value) => canEditRoom && saveSettings('queueSize', value)} />
            </div>

            <div className="setting-row">
              <span className="setting-label">Min. zakolejkowanych</span>
              <div className="note-picker note-picker-sm">
                {[0, 1, 2, 3, 4].map((count) => (
                  <button key={count} className={`note-btn${voteThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('voteThreshold', count)} disabled={!canEditRoom}>
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Wymagane glosy do pominiecia</span>
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
              <span className="setting-label">Propozycje gosci</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!allowSuggestions} onChange={(event) => saveSettings('allowSuggestions', event.target.checked)} disabled={!canEditRoom} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <span className="setting-label">Sluchaj u goscia</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!allowGuestListening} onChange={(event) => saveSettings('allowGuestListening', event.target.checked)} disabled={!canEditRoom} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div className="settings-group">
            <span className="settings-group-title">Wyswietlanie</span>

            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
              <span className="setting-label">Pasek z tekstem</span>
              <input
                className="setting-ticker-input"
                type="text"
                placeholder="Tekst paska..."
                value={tickerText}
                onChange={(event) => saveSettings('tickerText', event.target.value)}
                disabled={!canEditRoom}
              />
              <div className="setting-toggle-group">
                <button className={`btn-setting${tickerOnScreen ? ' active' : ''}`} onClick={() => saveSettings('tickerOnScreen', !tickerOnScreen)} disabled={!canEditRoom}>Na ekranie</button>
                <button className={`btn-setting${tickerForGuests ? ' active' : ''}`} onClick={() => saveSettings('tickerForGuests', !tickerForGuests)} disabled={!canEditRoom}>U widza</button>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Miniatury</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!showThumbnails} onChange={(event) => saveSettings('showThumbnails', event.target.checked)} disabled={!canEditRoom} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <span className="setting-label">Pokaz QR code</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!showQr} onChange={onToggleQr} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <span className="setting-label">Pokaz kod pokoju</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!showRoomCode} onChange={onToggleShowRoomCode} />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <span className="setting-label">Pokaz kolejke</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!showQueueOverlay} onChange={onToggleQueueOverlay} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          <div className="settings-group">
            <span className="settings-group-title">Opcje pokoju</span>

            <div className="setting-row">
              <span className="setting-label">Nazwa</span>
              <input
                className="setting-rename-input"
                key={room?.id ?? 'room-name'}
                defaultValue={room?.name ?? ''}
                onBlur={(event) => handleRoomNameSave(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && event.target.blur()}
                placeholder="Nazwa pokoju..."
                disabled={!canEditRoom}
              />
            </div>

            <div className="setting-row">
              <span className="setting-label">Widocznosc pokoju</span>
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
                      <span className="settings-stat-label">Ocena{ratingCount > 0 ? ` (${ratingCount} glosow)` : ''}</span>
                    </div>
                    <div className="settings-stat">
                      <span className="settings-stat-value">{room?.totalPlays ?? 0}</span>
                      <span className="settings-stat-label">Odtworzen</span>
                    </div>
                    <div className="settings-stat">
                      <span className="settings-stat-value">{room?.totalVotes ?? 0}</span>
                      <span className="settings-stat-label">Glosow</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            {canEditRoom && (
              <div className="setting-row">
                <button className="btn-setting-action" style={{ flex: 1 }} onClick={copyAdminLink}>
                  {copied === 'admin' ? 'Skopiowano' : roomType === 'public' ? 'Skopiuj link pokoju' : 'Skopiuj link admina'}
                </button>
              </div>
            )}

            <div className="setting-row setting-row--import-export">
              <button className="btn-setting-action" style={{ flex: 1 }} onClick={exportPlaylist}>Eksportuj</button>
              {canEditRoom && (
                <label className="btn-setting-action btn-file" style={{ flex: 1 }}>
                  Importuj
                  <input type="file" accept="application/json,.json" onChange={handleImportChange} />
                </label>
              )}
            </div>

            <div className="setting-row setting-row--message">
              <ContactMessageForm
                triggerClassName="btn-setting-action"
                triggerLabel="Napisz wiadomosc"
                title="Napisz wiadomosc o pokoju"
                description="Mozesz zapisac uwage, blad albo pomysl powiazany z tym pokojem."
                successMessage="Wiadomosc zostala zapisana."
                submitLabel="Wyslij wiadomosc"
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
