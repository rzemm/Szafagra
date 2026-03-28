import { lazy, Suspense, useEffect, useState } from 'react'
import { useLanguage } from '../context/useLanguage'
import { usePartyDiscovery } from '../hooks/usePartyDiscovery.js'
import logoUrl from '../assets/logo.png'
import { HomeDiscoverSection } from './home/HomeDiscoverSection.jsx'
import { HomeFooterActions } from './home/HomeFooterActions.jsx'
import { HomeHeader } from './home/HomeHeader.jsx'
import { HomeOwnedRoomsSection } from './home/HomeOwnedRoomsSection.jsx'

const LazyHomeCreateRoomModals = lazy(() => import('./home/HomeCreateRoomModals.jsx').then((module) => ({ default: module.HomeCreateRoomModals })))
const LazyPartyPreviewModal = lazy(() => import('./home/PartyPreviewModal.jsx').then((module) => ({ default: module.PartyPreviewModal })))
const LazyUserProfileModal = lazy(() => import('./UserProfileModal.jsx').then((module) => ({ default: module.UserProfileModal })))

export function HomePage({
  creatingRoom,
  user,
  ownedRooms,
  upcomingOpenParties,
  guestVisitedRooms,
  onCreatePartyRoom,
  onDeleteRoom,
  onJoinRoom,
  onSignIn,
  onSignOut,
  onOpenCookieSettings,
  onUpdateDisplayName,
  onSubmitMessage,
}) {
  const { t, lang, toggleLang } = useLanguage()
  const [roomInput, setRoomInput] = useState('')
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [previewPartyId, setPreviewPartyId] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('party')?.trim() ?? ''
  })
  const [discoverTab, setDiscoverTab] = useState('parties')
  const [showPartyWizard, setShowPartyWizard] = useState(false)
  const [headerSlide, setHeaderSlide] = useState(0)
  const {
    nearbyInput,
    nearbyRef,
    nearbyLoading,
    nearbyError,
    partiesWithDistance,
    setNearbyInput,
    clearNearby,
    handleNearbySearch,
    handleNearbyGps,
  } = usePartyDiscovery(upcomingOpenParties)

  useEffect(() => {
    const timer = setInterval(() => setHeaderSlide((slide) => (slide + 1) % 3), 2800)
    return () => clearInterval(timer)
  }, [])

  const isLoggedIn = user && !user.isAnonymous
  const previewParty = upcomingOpenParties.find((party) => party.id === previewPartyId) ?? null

  const handleCreateParty = async ({ name, extraSettings }) => {
    const result = await onCreatePartyRoom(name, extraSettings)
    if (!result) return false
    window.sessionStorage.setItem('szafagra.newPartyShare', result.guestToken)
    window.location.href = `${window.location.pathname}?room=${encodeURIComponent(result.roomId)}`
    return true
  }

  const handleJoin = () => {
    if (!roomInput.trim()) return
    onJoinRoom(roomInput)
  }

  const handleOpenPartyPreview = (party) => {
    setDiscoverTab('parties')
    setPreviewPartyId(party.id)
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    url.searchParams.set('party', party.id)
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }

  const handleClosePartyPreview = () => {
    setPreviewPartyId('')
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    url.searchParams.delete('party')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  }

  return (
    <>
      <div className="homepage">
        <HomeHeader
          user={user}
          isLoggedIn={isLoggedIn}
          headerSlide={headerSlide}
          onSetHeaderSlide={setHeaderSlide}
          onOpenAccountSettings={() => setShowAccountSettings(true)}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          logoUrl={logoUrl}
          t={t}
        />

        <div className="homepage-body">
          <div className="homepage-join-row">
            <input
              className="homepage-join-input"
              type="text"
              placeholder={t('enterRoomCode')}
              value={roomInput}
              onChange={(event) => setRoomInput(event.target.value.toUpperCase())}
              onKeyDown={(event) => event.key === 'Enter' && handleJoin()}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className="homepage-btn homepage-btn--join"
              onClick={handleJoin}
              disabled={!roomInput.trim()}
            >
              {t('join')}
            </button>
          </div>

          <div className="homepage-cols-row">
            <HomeOwnedRoomsSection
              ownedRooms={ownedRooms}
              isLoggedIn={isLoggedIn}
              creatingRoom={creatingRoom}
              onDeleteRoom={onDeleteRoom}
              onOpenPartyWizard={() => setShowPartyWizard(true)}
              t={t}
            />

            <HomeDiscoverSection
              discoverTab={discoverTab}
              onSetDiscoverTab={setDiscoverTab}
              isLoggedIn={isLoggedIn}
              nearbyInput={nearbyInput}
              nearbyRef={nearbyRef}
              nearbyLoading={nearbyLoading}
              nearbyError={nearbyError}
              partiesWithDistance={partiesWithDistance}
              guestVisitedRooms={guestVisitedRooms ?? []}
              onSetNearbyInput={setNearbyInput}
              onClearNearby={clearNearby}
              onNearbySearch={handleNearbySearch}
              onNearbyGps={handleNearbyGps}
              onOpenPartyPreview={handleOpenPartyPreview}
              onJoinRoom={onJoinRoom}
              lang={lang}
              t={t}
            />
          </div>
        </div>

        <HomeFooterActions
          onOpenCookieSettings={onOpenCookieSettings}
          onSubmitMessage={onSubmitMessage}
          onToggleLang={toggleLang}
          t={t}
        />
      </div>

      {previewParty && (
        <Suspense fallback={null}>
          <LazyPartyPreviewModal
            party={previewParty}
            onClose={handleClosePartyPreview}
            lang={lang}
            t={t}
          />
        </Suspense>
      )}

      {showPartyWizard && (
        <Suspense fallback={null}>
          <LazyHomeCreateRoomModals
            isOpen={showPartyWizard}
            creatingRoom={creatingRoom}
            t={t}
            onClose={() => setShowPartyWizard(false)}
            onCreateParty={handleCreateParty}
          />
        </Suspense>
      )}

      {showAccountSettings && isLoggedIn && (
        <Suspense fallback={null}>
          <LazyUserProfileModal
            user={user}
            onClose={() => setShowAccountSettings(false)}
            onUpdateDisplayName={onUpdateDisplayName}
          />
        </Suspense>
      )}
    </>
  )
}
