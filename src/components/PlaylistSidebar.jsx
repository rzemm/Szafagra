import { useState } from 'react'
import { ScrollText } from './ScrollText'

function NotePickerInline({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="note-picker-notes">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          className={`note-icon-btn${(hover ? hover >= n : value >= n) ? ' active' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          title={`${n} utw${n === 1 ? 'ór' : 'ory'} w grupie`}
        >♪</button>
      ))}
    </div>
  )
}

export function PlaylistSidebar(props) {
  const {
    leftPanel,
    showOwnerUI,
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
    onToggleQr,
    onToggleQueueOverlay,
  } = props

  const [searchQuery, setSearchQuery] = useState('')
  const [roomNameInput, setRoomNameInput] = useState(room?.name ?? '')

  const handleImportChange = async (event) => {
    const [file] = event.target.files ?? []
    if (file) await importPlaylist(file)
    event.target.value = ''
  }

  const handleRoomNameSave = () => {
    const trimmed = roomNameInput.trim()
    if (trimmed && trimmed !== room?.name) onRenameRoom(trimmed)
  }

  const songs = room?.songs ?? []
  const filteredSongs = searchQuery.trim()
    ? songs.filter((song) => song.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : songs

  return (
    <aside className={`sidebar${leftPanel ? '' : ' sidebar-hidden'}`}>

      {/* ── Lista piosenek ───────────────────────────────── */}
      {leftPanel === 'songs' && room && (
        <div className="section songs-section">
          <div className="sidebar-search-bar">
            <input
              className="sidebar-search-input"
              type="text"
              placeholder="Szukaj piosenek..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="sidebar-search-clear" onClick={() => setSearchQuery('')} title="Wyczysc">✕</button>
            )}
          </div>
          <div className="songs-content">
            <div className="song-list">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className={`song-item${currentSong?.id === song.id && isPlaying ? ' song-playing' : ''}${showOwnerUI ? ' song-item-clickable' : ''}`}
                  onClick={showOwnerUI ? () => playSongNow(song) : undefined}
                >
                  {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />}
                  <span className="song-title">{song.title}</span>
                  {showOwnerUI && (
                    <>
                      <button className="btn-icon queue-add" onClick={(event) => { event.stopPropagation(); queueSong(song) }} title="Dodaj do kolejki">+</button>
                      <button className="btn-icon danger" onClick={(event) => { event.stopPropagation(); if (window.confirm(`Usun "${song.title}"?`)) deleteSong(song.id) }} title="Usun">🗑</button>
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

      {leftPanel === 'songs' && suggestions?.length > 0 && (
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
                  <button className="btn-icon play" onClick={() => approveSuggestion(suggestion)} title="Dodaj do listy">✓</button>
                  <button className="btn-icon danger" onClick={() => rejectSuggestion(suggestion.id)} title="Odrzuc">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Kolejka ──────────────────────────────────────── */}
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
                  <button className="btn-icon play" onClick={() => playSongNow(song)}>▶</button>
                  <button className="btn-icon danger" onClick={() => removeFromQueue(song.id)} title="Usun z kolejki">✕</button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="sidebar-queue-empty">{isPlaying ? 'Kolejka jest pusta' : 'Odtwarzanie zatrzymane'}</p>
          )}
        </div>
      )}

      {/* ── Ustawienia ───────────────────────────────────── */}
      {leftPanel === 'settings' && (
        <div className="section sidebar-settings-list">

          <div className="setting-row setting-row--rename">
            <span className="setting-label">Nazwa pokoju</span>
            <div className="setting-rename-group">
              <input
                className="setting-rename-input"
                value={roomNameInput}
                onChange={(e) => setRoomNameInput(e.target.value)}
                onBlur={handleRoomNameSave}
                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                placeholder="Nazwa pokoju..."
              />
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Rodzaj glosowania</span>
            <div className="setting-toggle-group">
              <button className={`btn-setting${voteMode === 'highest' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'highest')}>
                Najwiecej
              </button>
              <button className={`btn-setting${voteMode === 'weighted' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'weighted')}>
                Kazdy ma szanse
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Utworow w grupie</span>
            <NotePickerInline value={queueSize} onChange={(n) => saveSettings('queueSize', n)} />
          </div>

          <div className="setting-row">
            <span className="setting-label">Min. zakolejkowanych</span>
            <div className="note-picker note-picker-sm">
              {[0, 1, 2, 3, 4].map((count) => (
                <button key={count} className={`note-btn${voteThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('voteThreshold', count)}>
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
              onChange={(e) => saveSettings('skipThreshold', Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <div className="setting-row">
            <span className="setting-label">Propozycje gosci</span>
            <div className="setting-toggle-group">
              <button className={`btn-setting${!allowSuggestions ? ' active' : ''}`} onClick={() => saveSettings('allowSuggestions', false)}>
                Wylaczone
              </button>
              <button className={`btn-setting${allowSuggestions ? ' active' : ''}`} onClick={() => saveSettings('allowSuggestions', true)}>
                Wlaczone
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Miniatury</span>
            <div className="setting-toggle-group">
              <button className={`btn-setting${!showThumbnails ? ' active' : ''}`} onClick={() => saveSettings('showThumbnails', false)}>
                Wylaczone
              </button>
              <button className={`btn-setting${showThumbnails ? ' active' : ''}`} onClick={() => saveSettings('showThumbnails', true)}>
                Wlaczone
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Pokaz QR code</span>
            <div className="setting-toggle-group">
              <button className={`btn-setting${!showQr ? ' active' : ''}`} onClick={onToggleQr}>
                Ukryty
              </button>
              <button className={`btn-setting${showQr ? ' active' : ''}`} onClick={onToggleQr}>
                Widoczny
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">Pokaz kolejke</span>
            <div className="setting-toggle-group">
              <button className={`btn-setting${!showQueueOverlay ? ' active' : ''}`} onClick={onToggleQueueOverlay}>
                Ukryta
              </button>
              <button className={`btn-setting${showQueueOverlay ? ' active' : ''}`} onClick={onToggleQueueOverlay}>
                Widoczna
              </button>
            </div>
          </div>

          <div className="setting-row setting-row--stats">
            {(() => {
              const ratingsMap = room?.ratings ?? {}
              const ratingValues = Object.values(ratingsMap)
              const ratingCount = ratingValues.length
              const avgRating = ratingCount > 0
                ? (ratingValues.reduce((s, v) => s + v, 0) / ratingCount).toFixed(1)
                : '–'
              return (
                <div className="settings-stats">
                  <div className="settings-stat">
                    <span className="settings-stat-value">{avgRating}</span>
                    <span className="settings-stat-label">Ocena{ratingCount > 0 ? ` (${ratingCount} głosów)` : ''}</span>
                  </div>
                  <div className="settings-stat">
                    <span className="settings-stat-value">{room?.totalPlays ?? 0}</span>
                    <span className="settings-stat-label">Odtworzeń</span>
                  </div>
                  <div className="settings-stat">
                    <span className="settings-stat-value">{room?.totalVotes ?? 0}</span>
                    <span className="settings-stat-label">Głosów</span>
                  </div>
                </div>
              )
            })()}
          </div>

          <div className="setting-row setting-row--actions">
            <button
              className="btn-setting-action"
              onClick={copyAdminLink}
            >
              {copied === 'admin'
                ? '✓ Skopiowano'
                : roomType === 'public'
                  ? '⎋ Skopiuj link pokoju'
                  : '⚙ Skopiuj link admina'}
            </button>
            <button className="btn-setting-action" onClick={exportPlaylist}>
              ↓ Eksportuj liste
            </button>
            <label className="btn-setting-action btn-file">
              ↑ Importuj liste
              <input type="file" accept="application/json,.json" onChange={handleImportChange} />
            </label>
          </div>

        </div>
      )}
    </aside>
  )
}
