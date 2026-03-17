export function RoomHeader({ showOwnerUI, isOwner, sidebarOpen, setSidebarOpen, viewAsGuest, setViewAsGuest, copied, copyLink }) {
  return (
    <header className="header">
      <div className="header-inner">
        <span className="header-icon">🎵</span>
        <h1>JUKEBOX</h1>
        {!showOwnerUI && <span className="visitor-badge">{isOwner ? 'Podgląd gościa' : 'Tryb gościa'}</span>}
      </div>
      <div className="header-actions">
        {showOwnerUI && (
          <button className="btn-view-toggle" onClick={() => setSidebarOpen(v => !v)} title={sidebarOpen ? 'Ukryj panel' : 'Pokaż panel'}>
            {sidebarOpen ? '◀ Panel' : '▶ Panel'}
          </button>
        )}
        {isOwner && (
          <button className="btn-view-toggle" onClick={() => setViewAsGuest(v => !v)}>
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
