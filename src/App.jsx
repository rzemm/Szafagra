import { HomePage } from './components/HomePage'
import { UsernamePickerModal } from './components/UsernamePickerModal'
import {
  CookieConsentBanner,
  CookieSettingsModal,
} from './components/CookieConsent'
import { GuestRoomView } from './components/GuestRoomView'
import { OwnerRoomView } from './components/OwnerRoomView'
import { RoomHeader } from './components/RoomHeader'
import { useConsentManager } from './hooks/useConsentManager'
import { useRoomRoute } from './hooks/useRoomRoute'
import { useRoomScreen } from './hooks/useRoomScreen'
import { useLanguage } from './context/useLanguage'
import './App.css'

function SplashScreen({ message }) {
  return <div className="splash"><div className="splash-icon" aria-hidden="true">{'\u266B'}</div><p>{message}</p></div>
}

export default function App() {
  const route = useRoomRoute()
  const screen = useRoomScreen(route)
  const consent = useConsentManager()
  const { t } = useLanguage()

  if (!screen.auth.authReady) {
    return <SplashScreen message={t('connecting')} />
  }

  let content

  if (!screen.routeState.hasRoomParam) {
    content = (
      <HomePage
        {...screen.homeScreen}
        onPreviewRoom={(roomId) => screen.routeState.navigateToRoom(roomId, { previewMode: true })}
        onOpenCookieSettings={consent.openSettings}
      />
    )
  } else if (screen.roomScreen.roomError) {
    content = <SplashScreen message={screen.roomScreen.roomError} />
  } else if (!screen.roomScreen.room) {
    content = <SplashScreen message={t('loadingRoom')} />
  } else {
    content = (
      <>
        {screen.roomScreen.uiError && <div className="error-banner">{screen.roomScreen.uiError}</div>}
        <RoomHeader
          {...screen.roomScreen.header}
          onOpenCookieSettings={consent.openSettings}
        />

        <main className="main">
          {screen.roomScreen.showOwnerUI ? (
            <OwnerRoomView {...screen.roomScreen.ownerView} />
          ) : (
            <GuestRoomView
              {...screen.roomScreen.guestView}
              onOpenCookieSettings={consent.openSettings}
            />
          )}
        </main>
      </>
    )
  }

  return (
    <div className="app">
      {screen.usernamePrompt.needsUsername && (
        <UsernamePickerModal onConfirm={screen.usernamePrompt.confirmUsername} />
      )}
      {content}

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
