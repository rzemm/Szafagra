import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export function RoomHeader({ showOwnerUI, isOwner, sidebarOpen, toggleSidebar, viewAsGuest, toggleViewAsGuest, copied, copyAdminLink, copyVoterLink, voterUrl, joinUrl, setJoinUrl, handleJoinRoom }) {
  const [showQr, setShowQr] = useState(false)

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
        {showOwnerUI && voterUrl && (
          <button className="btn-share btn-share-qr" onClick={() => setShowQr(true)} title="Pokaż QR code dla gości">
            ▦ QR
          </button>
        )}
      </div>

      {showQr && (
        <div className="qr-overlay" onClick={() => setShowQr(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Dołącz jako gość</h2>
            <QRCodeSVG value={voterUrl} size={220} />
            <p className="qr-url">{voterUrl}</p>
            <button className="btn-share btn-share-voter" onClick={() => { copyVoterLink(); setShowQr(false) }}>
              {copied === 'voter' ? '✓ Skopiowano' : '🔗 Kopiuj link'}
            </button>
            <button className="qr-close" onClick={() => setShowQr(false)}>✕</button>
          </div>
        </div>
      )}
    </header>
  )
}
