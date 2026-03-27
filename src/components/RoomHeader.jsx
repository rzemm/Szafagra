import { lazy, Suspense, useState } from 'react'
import { HelpModal } from './HelpPage'
import { useLanguage } from '../context/useLanguage'
import logoUrl from '../assets/logo.png'

const LazyUserProfileModal = lazy(() => import('./UserProfileModal').then((module) => ({ default: module.UserProfileModal })))

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

export function RoomHeader({
  showOwnerUI,
  leftPanel,
  toggleLeftPanel,
  user,
  signInWithGoogle,
  signOutUser,
  onShareGuestLink,
  guestCopied,
  proposalsCount = 0,
  nominationsCount = 0,
  onOpenCookieSettings,
  updateDisplayName,
  onCreateRoomFromYt,
  onAddYtToRoom,
  currentRoomId,
  ownedRooms,
}) {
  const { t, toggleLang } = useLanguage()
  const [profileOpen, setProfileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <header className={`header${!showOwnerUI ? ' header--guest' : ''}`}>
      <div className="header-inner">
        {showOwnerUI && (
          <>
            <button
              className={`btn-panel-toggle${leftPanel === 'songs' ? ' active' : ''}`}
              onClick={() => toggleLeftPanel('songs')}
              title={t('panelSongsTitle')}
            >
              🎵 {t('panelSongs')}
            </button>
            <button
              className={`btn-panel-toggle${leftPanel === 'proposals' ? ' active' : ''}${proposalsCount > 0 ? ' btn-panel-toggle--highlight' : ''}`}
              onClick={() => toggleLeftPanel('proposals')}
              title={t('panelProposalsTitle')}
            >
              📥 {t('panelProposals')}{proposalsCount > 0 ? ` (${proposalsCount})` : ''}
            </button>
            <button
              className={`btn-panel-toggle${leftPanel === 'nominations' ? ' active' : ''}`}
              onClick={() => toggleLeftPanel('nominations')}
              title={t('panelNominationsTitle')}
            >
              🎤 {t('panelNominations')}{nominationsCount > 0 ? ` (${nominationsCount})` : ''}
            </button>
            <button
              className={`btn-panel-toggle${leftPanel === 'settings' ? ' active' : ''}`}
              onClick={() => toggleLeftPanel('settings')}
              title={t('panelSettingsTitle')}
            >
              ⚙️ {t('panelSettings')}
            </button>
          </>
        )}
        <a href="/" className="header-logo"><img src={logoUrl} alt="Szafagra" className="header-logo-img" /></a>
      </div>


      <div className="header-actions">
        {showOwnerUI && (
          <button className="header-utility-link" onClick={onOpenCookieSettings}>
            {t('cookies')}
          </button>
        )}

        {showOwnerUI && (
          <button className="lang-toggle" onClick={toggleLang}>{t('langToggle')}</button>
        )}

        {user?.isAnonymous ? (
          <button className="header-google-btn" onClick={signInWithGoogle} title={t('signInGoogle2')}>
            <GoogleIcon />
            <span>{t('signIn')}</span>
          </button>
        ) : user ? (
          <div className="header-google-user">
            <button
              className="header-avatar-btn"
              onClick={() => setProfileOpen(true)}
              title={t('accountSettings')}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="header-google-avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="header-avatar-initials">
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </span>
              )}
            </button>
            <button className="header-google-logout" onClick={signOutUser}>{t('signOut')}</button>
            {profileOpen && (
              <Suspense fallback={null}>
                <LazyUserProfileModal
                  user={user}
                  onClose={() => setProfileOpen(false)}
                  onUpdateDisplayName={updateDisplayName}
                  onCreateRoomFromYt={onCreateRoomFromYt}
                  onAddYtToRoom={onAddYtToRoom}
                  currentRoomId={currentRoomId}
                  ownedRooms={ownedRooms}
                />
              </Suspense>
            )}
          </div>
        ) : null}

        {showOwnerUI ? (
          <a className="btn-share" href="https://buycoffee.to/szafifi" target="_blank" rel="noreferrer">{t('buyCoffee')}</a>
        ) : (
          <button className="btn-header-share" onClick={onShareGuestLink} title={t('shareLink')}>
            {guestCopied ? 'OK' : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
            )}
          </button>
        )}
      </div>
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </header>
  )
}
