export function PlaylistSidebar(props) {
  const {
    sidebarOpen,
    showOwnerUI,
    collapsed,
    toggleSection,
    voteMode,
    skipThreshold,
    allowSuggestions,
    saveSettings,
    isPlaying,
    playlists,
    activePlaylist,
    activePlaylistId,
    editingId,
    editingName,
    startEditPlaylist,
    cancelEditPlaylist,
    setEditingName,
    saveEditPlaylist,
    selectPlaylist,
    startJukeboxWith,
    deletePlaylist,
    newPlaylistName,
    setNewPlaylistName,
    addPlaylist,
    exportPlaylist,
    importPlaylist,
    currentSong,
    playSongNow,
    deleteSong,
    ytPlaylistId,
    importingYtPlaylist,
    importFromYouTube,
    suggestions,
    approveSuggestion,
    rejectSuggestion,
    showThumbnails,
  } = props

  const handleImportChange = async (event) => {
    const [file] = event.target.files ?? []
    if (file) await importPlaylist(file)
    event.target.value = ''
  }

  const ratings = activePlaylist?.ratings ?? {}
  const ratingValues = Object.values(ratings).filter(v => v > 0)
  const ratingAvg = ratingValues.length > 0
    ? (ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length).toFixed(1)
    : null
  const ratingCount = ratingValues.length
  const totalPlays = activePlaylist?.totalPlays ?? 0
  const totalVotes = activePlaylist?.totalVotes ?? 0

  return (
    <aside className={`sidebar${sidebarOpen ? '' : ' sidebar-hidden'}`}>
      {showOwnerUI && (
        <div className="section">
          <div className="section-title-row" onClick={() => toggleSection('settings')}>
            <h2 className="section-title">Ustawienia pokoju</h2>
            <span className="section-arrow">{collapsed.settings ? '▶' : '▼'}</span>
          </div>

          {!collapsed.settings && (
            <>
              <div className="setting-row">
                <span className="setting-label">Głosowanie</span>
                <div className="setting-toggle-group">
                  <button className={`btn-setting${voteMode === 'highest' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'highest')}>
                    Najwyższy wynik
                  </button>
                  <button className={`btn-setting${voteMode === 'weighted' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'weighted')}>
                    Ważone losowanie
                  </button>
                </div>
              </div>

              <div className="setting-row">
                <span className="setting-label">Głosów do pominięcia utworu</span>
                <div className="note-picker">
                  {[0, 1, 2, 3, 4].map((count) => (
                    <button key={count} className={`note-btn${skipThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('skipThreshold', count)}>
                      {count === 0 ? 'off' : count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <span className="setting-label">Propozycje gości</span>
                <div className="setting-toggle-group">
                  <button className={`btn-setting${!allowSuggestions ? ' active' : ''}`} onClick={() => saveSettings('allowSuggestions', false)}>
                    Wyłączone
                  </button>
                  <button className={`btn-setting${allowSuggestions ? ' active' : ''}`} onClick={() => saveSettings('allowSuggestions', true)}>
                    Włączone
                  </button>
                </div>
              </div>

              <div className="setting-row">
                <span className="setting-label">Miniaturki filmów</span>
                <div className="setting-toggle-group">
                  <button className={`btn-setting${showThumbnails ? ' active' : ''}`} onClick={() => saveSettings('showThumbnails', true)}>
                    Włączone
                  </button>
                  <button className={`btn-setting${!showThumbnails ? ' active' : ''}`} onClick={() => saveSettings('showThumbnails', false)}>
                    Wyłączone
                  </button>
                </div>
              </div>

              {activePlaylist && (
                <div className="sidebar-stats">
                  <p className="sidebar-stats-title">Statystyki: {activePlaylist.name}</p>
                  <div className="sidebar-stats-row">
                    {ratingAvg !== null
                      ? <span className="sidebar-stat">⭐ {ratingAvg} <span className="sidebar-stat-sub">({ratingCount} {ratingCount === 1 ? 'ocena' : ratingCount < 5 ? 'oceny' : 'ocen'})</span></span>
                      : <span className="sidebar-stat sidebar-stat-dim">⭐ brak ocen</span>
                    }
                    <span className="sidebar-stat">▶ {totalPlays} <span className="sidebar-stat-sub">odtworzeń</span></span>
                    <span className="sidebar-stat">▲ {totalVotes} <span className="sidebar-stat-sub">głosów</span></span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="section">
        <div className="section-title-row" onClick={() => toggleSection('playlists')}>
          <h2 className="section-title">Playlisty</h2>
          <span className="section-arrow">{collapsed.playlists ? '▶' : '▼'}</span>
        </div>

        {!collapsed.playlists && (
          <>
            <div className="playlist-list">
              {playlists.length === 0 && (
                <p className="empty-hint">{showOwnerUI ? 'Utwórz pierwszą playlistę poniżej' : 'Brak playlist'}</p>
              )}

              {playlists.map((playlist) => {
                const isActivePlaylist = playlist.id === activePlaylistId
                const isPlayingPlaylist = playlist.id === activePlaylist?.id && isPlaying

                return (
                  <div key={playlist.id} className={`playlist-item${isActivePlaylist ? ' active' : ''}${isPlayingPlaylist ? ' playing' : ''}`}>
                    {editingId === playlist.id ? (
                      <input
                        className="edit-input"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') saveEditPlaylist()
                          if (event.key === 'Escape') cancelEditPlaylist()
                        }}
                        onBlur={saveEditPlaylist}
                        autoFocus
                      />
                    ) : (
                      <button className="playlist-name-btn" onClick={() => selectPlaylist(playlist.id)}>
                        {playlist.name}
                        <span className="count">{playlist.songs.length}</span>
                      </button>
                    )}

                    {showOwnerUI && (
                      <div className="playlist-actions">
                        <button className="btn-icon play" onClick={() => startJukeboxWith(playlist.id)} disabled={playlist.songs.length === 0}>▶</button>
                        <button className="btn-icon" onClick={() => startEditPlaylist(playlist.id, playlist.name)}>✎</button>
                        <button className="btn-icon danger" onClick={() => { if (window.confirm(`Usuń playlistę "${playlist.name}"?`)) deletePlaylist(playlist.id) }}>✕</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {showOwnerUI && (
              <>
                <div className="add-row">
                  <input
                    value={newPlaylistName}
                    onChange={(event) => setNewPlaylistName(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && addPlaylist()}
                    placeholder="Nazwa nowej playlisty..."
                  />
                  <button className="btn-accent" onClick={addPlaylist}>+</button>
                </div>

                <div className="playlist-import-export">
                  <button className="btn-secondary" onClick={exportPlaylist} disabled={!activePlaylist}>
                    Wyeksportuj playlistę
                  </button>
                  <label className="btn-secondary btn-file">
                    Zaimportuj playlistę
                    <input type="file" accept="application/json,.json" onChange={handleImportChange} />
                  </label>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {activePlaylist && (
        <div className="section songs-section">
          <div className="section-title-row" onClick={() => toggleSection('songs')}>
            <h2 className="section-title">{activePlaylist.name}</h2>
            <span className="section-arrow">{collapsed.songs ? '▶' : '▼'}</span>
          </div>

          {!collapsed.songs && (
            <div className="songs-content">
              {showOwnerUI && ytPlaylistId && (
                <div className="add-song-form">
                  <button className="btn-primary" onClick={importFromYouTube} disabled={importingYtPlaylist}>
                    {importingYtPlaylist ? 'Importowanie...' : '+ Importuj całą playlistę YT'}
                  </button>
                </div>
              )}

              <div className="song-list">
                {activePlaylist.songs.map((song) => (
                  <div
                    key={song.id}
                    className={`song-item${currentSong?.id === song.id && isPlaying ? ' song-playing' : ''}${showOwnerUI ? ' song-item-clickable' : ''}`}
                    onClick={showOwnerUI ? () => playSongNow(song) : undefined}
                  >
                    {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />}
                    <span className="song-title">{song.title}</span>
                    {showOwnerUI && (
                      <button className="btn-icon danger" onClick={(event) => { event.stopPropagation(); if (window.confirm(`Usuń "${song.title}"?`)) deleteSong(song.id) }}>🗑</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {suggestions?.length > 0 && (
        <div className="section">
          <div className="section-title-row" onClick={() => toggleSection('suggestions')}>
            <h2 className="section-title">Propozycje <span className="count">{suggestions.length}</span></h2>
            <span className="section-arrow">{collapsed.suggestions ? '▶' : '▼'}</span>
          </div>

          {!collapsed.suggestions && (
            <div className="suggestions-list">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="suggestion-item">
                  {showThumbnails && <img src={`https://img.youtube.com/vi/${suggestion.ytId}/default.jpg`} alt="" className="song-thumb" />}
                  <span className="song-title">{suggestion.title}</span>
                  <div className="suggestion-actions">
                    <button className="btn-icon play" onClick={() => approveSuggestion(suggestion)} title="Dodaj do playlisty">✓</button>
                    <button className="btn-icon danger" onClick={() => rejectSuggestion(suggestion.id)} title="Odrzuć">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
