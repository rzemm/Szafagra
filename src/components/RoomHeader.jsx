export function RoomHeader({ showOwnerUI, isOwner, sidebarOpen, toggleSidebar, copied, copyAdminLink, copyVoterLink }) {
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
        {!showOwnerUI && !isOwner && <span className="visitor-badge">Tryb gościa</span>}
      </div>

      <div className="header-actions">
        {showOwnerUI && (
          <>
            <button className="btn-share" disabled title="Wkrótce">✉ Wyślij opinię</button>
            <button className="btn-share" disabled title="Wkrótce">☕ Postaw kawę</button>
            <button className="btn-share btn-share-admin" onClick={copyAdminLink} title="Kopiuj link admina">
              {copied === 'admin' ? '✓' : '⚙'} Admin
            </button>
          </>
        )}
        <button className="btn-share btn-share-voter" onClick={copyVoterLink} title="Kopiuj link dla głosujących">
          {copied === 'voter' ? '✓' : '🔗'} Głosujący
        </button>
      </div>
    </header>
  )
}
