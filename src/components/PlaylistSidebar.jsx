export function PlaylistSidebar(props) {
  const {
    sidebarOpen,
    showOwnerUI,
    collapsed,
    toggleSection,
    voteMode,
    queueSize,
    voteThreshold,
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
    newSongUrl,
    setNewSongUrl,
    newSongTitle,
    setNewSongTitle,
    urlErr,
    fetchingTitle,
    handleUrlBlur,
    addSong,
    ytPlaylistId,
    importingYtPlaylist,
    importFromYouTube,
    suggestions,
    approveSuggestion,
    rejectSuggestion,
  } = props

  const handleImportChange = async (event) => {
    const [file] = event.target.files ?? []
    if (file) await importPlaylist(file)
    event.target.value = ''
  }

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
                <span className="setting-label">Utworów w grupie</span>
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
                <span className="setting-label">Skip (goście)</span>
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
                        <button className="btn-icon danger" onClick={() => { if (window.confirm(`Usunąć playlistę "${playlist.name}"?`)) deletePlaylist(playlist.id) }}>✕</button>
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
              {showOwnerUI && (
                <div className="add-song-form">
                  <input
                    value={newSongUrl}
                    onChange={(event) => setNewSongUrl(event.target.value)}
                    onBlur={handleUrlBlur}
                    onKeyDown={(event) => event.key === 'Enter' && addSong()}
                    placeholder="Link YouTube..."
                    className={urlErr ? 'input-error' : ''}
                  />
                  <input
                    value={newSongTitle}
                    onChange={(event) => setNewSongTitle(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && addSong()}
                    placeholder={fetchingTitle ? 'Pobieranie tytułu...' : 'Tytuł (pobierany auto)'}
                    disabled={fetchingTitle}
                  />
                  {urlErr && <p className="error-msg">{urlErr}</p>}
                  {ytPlaylistId ? (
                    <button className="btn-primary" onClick={importFromYouTube} disabled={importingYtPlaylist}>
                      {importingYtPlaylist ? 'Importowanie...' : '+ Importuj całą playlistę YT'}
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={addSong}>+ Dodaj piosenkę</button>
                  )}
                </div>
              )}

              <div className="song-list">
                {activePlaylist.songs.map((song) => (
                  <div
                    key={song.id}
                    className={`song-item${currentSong?.id === song.id && isPlaying ? ' song-playing' : ''}${showOwnerUI ? ' song-item-clickable' : ''}`}
                    onClick={showOwnerUI ? () => playSongNow(song) : undefined}
                  >
                    <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />
                    <span className="song-title">{song.title}</span>
                    {showOwnerUI && (
                      <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); if (window.confirm(`Usunąć "${song.title}"?`)) deleteSong(song.id) }}>🗑</button>
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
              {suggestions.map(s => (
                <div key={s.id} className="suggestion-item">
                  <img src={`https://img.youtube.com/vi/${s.ytId}/default.jpg`} alt="" className="song-thumb" />
                  <span className="song-title">{s.title}</span>
                  <div className="suggestion-actions">
                    <button className="btn-icon play" onClick={() => approveSuggestion(s)} title="Dodaj do playlisty">✓</button>
                    <button className="btn-icon danger" onClick={() => rejectSuggestion(s.id)} title="Odrzuć">✕</button>
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
