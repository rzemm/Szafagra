export function PlaylistSidebar(props) {
  const {
    sidebarOpen,
    showOwnerUI,
    isPlaying,
    room,
    editingId,
    editingName,
    startEditPlaylist,
    cancelEditPlaylist,
    setEditingName,
    saveEditPlaylist,
    startJukebox,
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

  return (
    <aside className={`sidebar${sidebarOpen ? '' : ' sidebar-hidden'}`}>
      {room && (
        <div className="section songs-section">
          <div className="songs-content">
            {showOwnerUI && (
              <>
                <div className="playlist-import-export">
                  <button className="btn-secondary" onClick={() => startEditPlaylist('room', room.name)}>
                    Zmień nazwę
                  </button>
                  <button className="btn-secondary" onClick={exportPlaylist}>
                    Wyeksportuj listę
                  </button>
                  <label className="btn-secondary btn-file">
                    Zaimportuj listę
                    <input type="file" accept="application/json,.json" onChange={handleImportChange} />
                  </label>
                  <button className="btn-secondary" onClick={startJukebox} disabled={!room.songs?.length || isPlaying}>
                    Start
                  </button>
                </div>

                {ytPlaylistId && (
                  <div className="add-song-form">
                    <button className="btn-primary" onClick={importFromYouTube} disabled={importingYtPlaylist}>
                      {importingYtPlaylist ? 'Importowanie...' : '+ Importuj całą playlistę YT'}
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="song-list">
              {(room.songs ?? []).map((song) => (
                <div
                  key={song.id}
                  className={`song-item${currentSong?.id === song.id && isPlaying ? ' song-playing' : ''}${showOwnerUI ? ' song-item-clickable' : ''}`}
                  onClick={showOwnerUI ? () => playSongNow(song) : undefined}
                >
                  {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />}
                  <span className="song-title">{song.title}</span>
                  {showOwnerUI && (
                    <button className="btn-icon danger" onClick={(event) => { event.stopPropagation(); if (window.confirm(`Usuń "${song.title}"?`)) deleteSong(song.id) }}>
                      🗑
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {suggestions?.length > 0 && (
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
                  <button className="btn-icon danger" onClick={() => rejectSuggestion(suggestion.id)} title="Odrzuć">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
