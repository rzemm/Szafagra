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
    stopJukebox,
    copied,
    copyLink,
    joinUrl,
    setJoinUrl,
    handleJoinRoom,
  } = props

  return (
    <aside className={`sidebar${sidebarOpen ? '' : ' sidebar-hidden'}`}>
      {showOwnerUI && (
        <div className="section">
          <div className="section-title-row">
            <h2 className="section-title">Ustawienia pokoju</h2>
            <button className="btn-collapse" onClick={() => toggleSection('settings')}>
              {collapsed.settings ? '▶' : '▼'}
            </button>
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
                <span className="setting-label">Próg głosowania</span>
                <div className="note-picker">
                  {[1, 2, 3].map((count) => (
                    <button key={count} className={`note-btn${voteThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('voteThreshold', count)}>
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="setting-row">
                <span className="setting-label">Skip (goście)</span>
                <div className="note-picker">
                  {[0, 1, 2, 3, 4, 5].map((count) => (
                    <button key={count} className={`note-btn${skipThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('skipThreshold', count)}>
                      {count === 0 ? 'off' : count}
                    </button>
                  ))}
                </div>
              </div>

              <div className="share-row">
                <input value={window.location.href} readOnly />
                <button className="btn-share-mini" onClick={copyLink}>{copied ? '✓' : '🔗'}</button>
              </div>

              <div className="add-row" style={{ marginTop: '0.5rem' }}>
                <input
                  value={joinUrl}
                  onChange={(event) => setJoinUrl(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleJoinRoom()}
                  placeholder="Wklej link do pokoju..."
                />
                <button className="btn-accent" onClick={handleJoinRoom}>→</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="section">
        <div className="section-title-row">
          <h2 className="section-title">Playlisty</h2>
          <button className="btn-collapse" onClick={() => toggleSection('playlists')}>
            {collapsed.playlists ? '▶' : '▼'}
          </button>
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
                        <button className="btn-icon danger" onClick={() => deletePlaylist(playlist.id)}>✕</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {showOwnerUI && (
              <div className="add-row">
                <input
                  value={newPlaylistName}
                  onChange={(event) => setNewPlaylistName(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && addPlaylist()}
                  placeholder="Nazwa nowej playlisty..."
                />
                <button className="btn-accent" onClick={addPlaylist}>+</button>
              </div>
            )}
          </>
        )}
      </div>

      {activePlaylist && (
        <div className="section songs-section">
          <div className="section-title-row">
            <h2 className="section-title">{activePlaylist.name}</h2>
            <button className="btn-collapse" onClick={() => toggleSection('songs')}>
              {collapsed.songs ? '▶' : '▼'}
            </button>
          </div>

          {!collapsed.songs && (
            <>
              <div className="song-list">
                {activePlaylist.songs.map((song) => (
                  <div key={song.id} className={`song-item${currentSong?.id === song.id && isPlaying ? ' song-playing' : ''}`}>
                    <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />
                    <span className="song-title">{song.title}</span>
                    {showOwnerUI && (
                      <>
                        <button className="btn-icon play" onClick={() => playSongNow(song)}>▶</button>
                        <button className="btn-icon danger" onClick={() => deleteSong(song.id)}>✕</button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {showOwnerUI && (
                <>
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
                    <button className="btn-primary" onClick={addSong}>+ Dodaj piosenkę</button>
                  </div>

                  <div className="play-controls">
                    {!isPlaying ? (
                      <button className="btn-start" onClick={() => startJukeboxWith(activePlaylistId)} disabled={activePlaylist.songs.length === 0}>
                        ▶ START
                      </button>
                    ) : (
                      <button className="btn-stop" onClick={stopJukebox}>■ STOP</button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </aside>
  )
}
