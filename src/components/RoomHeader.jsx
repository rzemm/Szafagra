import { useState } from 'react'

export function RoomHeader({
  showOwnerUI,
  sidebarOpen,
  toggleSidebar,
  copied,
  copyAdminLink,
  newSongUrl,
  setNewSongUrl,
  handleUrlBlur,
  addSong,
  newSongTitle,
  fetchingTitle,
  urlErr,
  activePlaylist,
}) {
  const [guestCopied, setGuestCopied] = useState(false)

  const copyGuestLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setGuestCopied(true)
      setTimeout(() => setGuestCopied(false), 2500)
    })
  }

  return (
    <header className="header">
      <div className="header-inner">
        {showOwnerUI && (
          <button className="btn-sidebar-toggle" onClick={toggleSidebar} title={sidebarOpen ? 'Ukryj panel' : 'Pokaż panel'}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        )}
        <span className="header-icon">🎵</span>
        <a href="/" className="header-logo">szafi.fi</a>
      </div>

      {showOwnerUI && (
        <div className="header-add-song">
          <input
            className="header-song-input"
            value={newSongUrl}
            onChange={(event) => setNewSongUrl(event.target.value)}
            onBlur={handleUrlBlur}
            onKeyDown={(event) => event.key === 'Enter' && addSong()}
            placeholder={fetchingTitle ? 'Pobieranie tytułu…' : newSongTitle ? `🎵 ${newSongTitle}` : 'Dodaj piosenkę - wklej link YouTube…'}
            title={urlErr || undefined}
            style={urlErr ? { borderColor: 'var(--accent)' } : undefined}
            disabled={!activePlaylist}
          />
          <button className="btn-header-add" onClick={addSong} disabled={!newSongUrl.trim() || !activePlaylist}>+</button>
        </div>
      )}

      <div className="header-actions">
        {showOwnerUI ? (
          <>
            <a className="btn-share" href="https://buycoffee.to/szafifi" target="_blank" rel="noreferrer">☕ Postaw kawę</a>
            <button className="btn-share btn-share-admin" onClick={copyAdminLink} title="Kopiuj link admina">
              {copied === 'admin' ? '✓ Skopiowano' : '⚙ Skopiuj link dla admina'}
            </button>
          </>
        ) : (
          <button className="btn-header-share" onClick={copyGuestLink} title="Udostępnij link">
            {guestCopied ? '✓' : '⎋'}
          </button>
        )}
      </div>
    </header>
  )
}
