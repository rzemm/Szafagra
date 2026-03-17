export function RoomHeader({ showOwnerUI, isOwner, sidebarOpen, toggleSidebar, viewAsGuest, toggleViewAsGuest, copied, copyLink }) {
  return (
    <header className="header">
      <div className="header-inner">
        <span className="header-icon">🎵</span>
        <h1>JUKEBOX</h1>
        {!showOwnerUI && <span className="visitor-badge">{isOwner ? 'Podgląd gościa' : 'Tryb gościa'}</span>}
      </div>

      <div className="header-actions">
        {showOwnerUI && (
          <button className="btn-view-toggle" onClick={toggleSidebar} title={sidebarOpen ? 'Ukryj panel' : 'Pokaż panel'}>
            {sidebarOpen ? '◀ Panel' : '▶ Panel'}
          </button>
        )}
        {isOwner && (
          <button className="btn-view-toggle" onClick={toggleViewAsGuest}>
            {viewAsGuest ? '⚙ Widok admina' : '👁 Widok gościa'}
          </button>
        )}
        <button className="btn-share" onClick={copyLink}>
          {copied ? '✓ Link skopiowany!' : '🔗 Udostępnij pokój'}
        </button>
      </div>
    </header>
  )
}
