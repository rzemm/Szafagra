import { useState } from 'react'

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
  } = props

  const [searchQuery, setSearchQuery] = useState('')

  const handleImportChange = async (event) => {
    const [file] = event.target.files ?? []
    if (file) await importPlaylist(file)
    event.target.value = ''
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
                    <button className="btn-icon danger" onClick={(event) => { event.stopPropagation(); if (window.confirm(`Usun "${song.title}"?`)) deleteSong(song.id) }}>
                      🗑
                    </button>
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
                  <span className="queue-title">{song.title}</span>
                  <button className="btn-icon play" onClick={() => playSongNow(song)}>▶</button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="sidebar-queue-empty">{isPlaying ? 'Kolejka jest pusta' : 'Odtwarzanie zatrzymane'}</p>
          )}
        </div>
      )}

      {leftPanel === 'settings' && (
        <div className="section">
          <div className="sidebar-settings-list">

            <div className="setting-row">
              <span className="setting-label">Glosowanie</span>
              <div className="setting-toggle-group">
                <button className={`btn-setting${voteMode === 'highest' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'highest')}>
                  Najwyzszy wynik
                </button>
                <button className={`btn-setting${voteMode === 'weighted' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'weighted')}>
                  Wazone losowanie
                </button>
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Utworow w grupie</span>
              <div className="note-picker">
                {[1, 2, 3, 4, 5].map((count) => (
                  <button key={count} className={`note-btn${queueSize === count ? ' active' : ''}`} onClick={() => saveSettings('queueSize', count)}>
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Min. zakolejkowanych</span>
              <div className="note-picker">
                {[0, 1, 2, 3, 4].map((count) => (
                  <button key={count} className={`note-btn${voteThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('voteThreshold', count)}>
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">Skip (goscie)</span>
              <div className="note-picker">
                {[0, 1, 2, 3, 4].map((count) => (
                  <button key={count} className={`note-btn${skipThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('skipThreshold', count)}>
                    {count === 0 ? 'off' : count}
                  </button>
                ))}
              </div>
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
              <span className="setting-label">Import playlisty</span>
              <label className="btn-secondary btn-file">
                Importuj JSON
                <input type="file" accept="application/json,.json" onChange={handleImportChange} />
              </label>
            </div>

          </div>
        </div>
      )}
    </aside>
  )
}
