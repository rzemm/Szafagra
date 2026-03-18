import { useState } from 'react'

export function RoomHeader({ showOwnerUI, isOwner, sidebarOpen, toggleSidebar, copied, copyAdminLink, copyVoterLink }) {
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
        <h1>szafi.fi</h1>
      </div>

      <div className="header-actions">
        {showOwnerUI ? (
          <>
            <button className="btn-share" disabled title="Wkrótce">✉ Wyślij opinię</button>
            <a className="btn-share" href="https://buycoffee.to/szafifi" target="_blank" rel="noreferrer">☕ Postaw kawę</a>
            <button className="btn-share btn-share-admin" onClick={copyAdminLink} title="Kopiuj link admina">
              {copied === 'admin' ? '✓' : '⚙'} Admin
            </button>
            <button className="btn-share btn-share-voter" onClick={copyVoterLink} title="Kopiuj link dla głosujących">
              {copied === 'voter' ? '✓' : '🔗'} Głosujący
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
