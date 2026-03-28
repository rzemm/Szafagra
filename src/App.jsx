import { lazy, Suspense, useState } from 'react'
import { UsernamePickerModal } from './components/UsernamePickerModal'
import {
  CookieConsentBanner,
  CookieSettingsModal,
} from './components/CookieConsent'
import { RoomHeader } from './components/RoomHeader'
import { useConsentManager } from './hooks/useConsentManager'
import { useRoomRoute } from './hooks/useRoomRoute'
import { useRoomScreen } from './hooks/useRoomScreen'
import { useLanguage } from './context/useLanguage'
import './App.css'

const LazyHomePage = lazy(() => import('./components/HomePage.jsx').then((module) => ({ default: module.HomePage })))
const LazyGuestRoomView = lazy(() => import('./components/GuestRoomView.jsx').then((module) => ({ default: module.GuestRoomView })))
const LazyOwnerRoomView = lazy(() => import('./components/OwnerRoomView.jsx').then((module) => ({ default: module.OwnerRoomView })))

function SplashScreen({ message }) {
  return <div className="splash"><div className="splash-icon" aria-hidden="true">{'\u266B'}</div><p>{message}</p></div>
}

export default function App() {
  const route = useRoomRoute()
  const screen = useRoomScreen(route)
  const consent = useConsentManager()
  const { t } = useLanguage()
  const [newPartyGuestToken] = useState(() => {
    if (typeof window === 'undefined') return null
    return window.sessionStorage.getItem('szafagra.newPartyShare') ?? null
  })
  const [showPartyShare, setShowPartyShare] = useState(!!newPartyGuestToken)
  const [partyShareCopied, setPartyShareCopied] = useState(false)

  const handleClosePartyShare = () => {
    window.sessionStorage.removeItem('szafagra.newPartyShare')
    setShowPartyShare(false)
  }

  const handleCopyPartyShare = () => {
    if (!newPartyGuestToken) return
    const url = `${window.location.origin}/?room=${encodeURIComponent(newPartyGuestToken)}`
    navigator.clipboard.writeText(url).then(() => {
      setPartyShareCopied(true)
      window.setTimeout(() => setPartyShareCopied(false), 2000)
    })
  }

  if (!screen.auth.authReady) {
    return <SplashScreen message={t('connecting')} />
  }

  let content

  if (!screen.routeState.hasRoomParam) {
    content = (
      <Suspense fallback={<SplashScreen message={t('connecting')} />}>
        <LazyHomePage
          {...screen.homeScreen}
          onOpenCookieSettings={consent.openSettings}
        />
      </Suspense>
    )
  } else if (screen.roomScreen.roomError) {
    content = <SplashScreen message={screen.roomScreen.roomError} />
  } else if (!screen.roomScreen.room) {
    content = <SplashScreen message={t('loadingRoom')} />
  } else {
    content = (
      <>
        {screen.roomScreen.uiError && <div className="error-banner">{screen.roomScreen.uiError}</div>}
        <RoomHeader {...screen.roomScreen.header} />

        <main className="main">
          <Suspense fallback={<SplashScreen message={t('loadingRoom')} />}>
            {screen.roomScreen.showOwnerUI ? (
              <LazyOwnerRoomView {...screen.roomScreen.ownerView} />
            ) : (
              <LazyGuestRoomView
                {...screen.roomScreen.guestView}
                onOpenCookieSettings={consent.openSettings}
              />
            )}
          </Suspense>
        </main>
      </>
    )
  }

  const partyShareUrl = newPartyGuestToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?room=${encodeURIComponent(newPartyGuestToken)}`
    : ''

  return (
    <div className="app">
      {screen.usernamePrompt.needsUsername && (
        <UsernamePickerModal onConfirm={screen.usernamePrompt.confirmUsername} />
      )}
      {content}
      {showPartyShare && screen.roomScreen.showOwnerUI && screen.roomScreen.room && (
        <div className="create-room-overlay" onClick={handleClosePartyShare}>
          <div className="party-config-modal" onClick={(event) => event.stopPropagation()}>
            <div className="create-room-header">
              <span className="create-room-title">{t('shareRoomTitle')}</span>
              <button className="create-room-close" onClick={handleClosePartyShare}>&#x2715;</button>
            </div>
            <div className="party-config-body">
              <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
                <input
                  className="song-settings-input"
                  type="text"
                  readOnly
                  value={partyShareUrl}
                  onFocus={(event) => event.target.select()}
                />
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                  {t('shareRoomDesc')}
                </p>
              </div>
            </div>
            <div className="party-config-footer">
              <button className="party-config-btn party-config-btn--back" onClick={handleClosePartyShare}>
                {t('shareRoomClose')}
              </button>
              <button className="party-config-btn party-config-btn--create" onClick={handleCopyPartyShare}>
                {partyShareCopied ? t('shareRoomCopied') : t('shareRoomCopy')}
              </button>
            </div>
          </div>
        </div>
      )}

      {consent.isBannerVisible && (
        <CookieConsentBanner
          onAcceptAll={consent.acceptAll}
          onRejectOptional={consent.rejectOptional}
          onOpenSettings={consent.openSettings}
        />
      )}
      <CookieSettingsModal
        consentState={consent.consentState}
        isOpen={consent.isSettingsOpen}
        onClose={consent.closeSettings}
        onAcceptAll={consent.acceptAll}
        onRejectOptional={consent.rejectOptional}
        onSavePreferences={consent.savePreferences}
        onOpenSettings={consent.openSettingsLink}
      />
    </div>
  )
}
