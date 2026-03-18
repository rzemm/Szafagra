export function RoomHeader({ showOwnerUI, isOwner, sidebarOpen, toggleSidebar, viewAsGuest, toggleViewAsGuest, copied, copyAdminLink, copyVoterLink, joinUrl, setJoinUrl, handleJoinRoom }) {
  return (
    <header className="header">
      <div className="header-inner">
        {showOwnerUI && (
          <button className="btn-sidebar-toggle" onClick={toggleSidebar} title={sidebarOpen ? 'Ukryj panel' : 'Pokaż panel'}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        )}
        <span className="header-icon">🎵</span>
        <h1>JUKEBOX</h1>
        {!showOwnerUI && <span className="visitor-badge">{isOwner ? 'Podgląd gościa' : 'Tryb gościa'}</span>}
      </div>

      <div className="header-actions">
        {showOwnerUI && (
          <div className="header-join-row">
            <input
              className="header-join-input"
              value={joinUrl}
              onChange={(e) => setJoinUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              placeholder="ID pokoju..."
            />
            <button className="btn-view-toggle" onClick={handleJoinRoom}>→</button>
          </div>
        )}
        {isOwner && (
          <button className="btn-view-toggle" onClick={toggleViewAsGuest}>
            {viewAsGuest ? '⚙ Widok admina' : '👁 Widok gościa'}
          </button>
        )}
        {showOwnerUI && (
          <button className="btn-share btn-share-admin" onClick={copyAdminLink} title="Kopiuj link admina">
            {copied === 'admin' ? '✓' : '⚙'} Admin
          </button>
        )}
        <button className="btn-share btn-share-voter" onClick={copyVoterLink} title="Kopiuj link dla głosujących">
          {copied === 'voter' ? '✓' : '🔗'} Głosujący
        </button>
      </div>
    </header>
  )
}
