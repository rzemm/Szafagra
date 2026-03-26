import { lazy, Suspense, useEffect, useState } from 'react'
import { ScrollText } from './ScrollText.jsx'
import { useLanguage } from '../context/useLanguage'
import { ContactMessageForm } from './ContactMessageForm.jsx'
import { usePartyDiscovery } from '../hooks/usePartyDiscovery.js'
import logoUrl from '../assets/logo.png'

const LazyHomeCreateRoomModals = lazy(() => import('./home/HomeCreateRoomModals.jsx').then((module) => ({ default: module.HomeCreateRoomModals })))
const LazyPartyPreviewModal = lazy(() => import('./home/PartyPreviewModal.jsx').then((module) => ({ default: module.PartyPreviewModal })))
const LazyTopRatedRoomPreviewModal = lazy(() => import('./home/TopRatedRoomPreviewModal.jsx').then((module) => ({ default: module.TopRatedRoomPreviewModal })))
const LazyUserProfileModal = lazy(() => import('./UserProfileModal.jsx').then((module) => ({ default: module.UserProfileModal })))

const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14 8.46 11.88zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)

const IconMusic = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
  </svg>
)

const IconEye = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.55 }}>
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
)

const GoogleLogoSvg = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

export function HomePage({
  creatingRoom,
  user,
  ownedRooms,
  upcomingOpenParties,
  topRatedRooms,
  guestVisitedRooms,
  onCreateRoom,
  onCreatePartyRoom,
  onDeleteRoom,
  onJoinRoom,
  onPreviewRoom,
  onSeedRooms,
  onSignIn,
  onSignOut,
  onOpenCookieSettings,
  onUpdateDisplayName,
  onCreateRoomFromYt,
  onAddYtToRoom,
  onCopyForeignRoom,
  onAppendForeignToRoom,
  onSubmitMessage,
}) {
  const { t, lang, toggleLang } = useLanguage()
  const [roomInput, setRoomInput] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [previewRoomId, setPreviewRoomId] = useState(null)
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
  const previewRoom = topRatedRooms.find((room) => room.id === previewRoomId) ?? null
  const previewParty = upcomingOpenParties.find((party) => party.id === previewPartyId) ?? null

  const handleCreateParty = async ({ name, extraSettings }) => {
    const result = await onCreatePartyRoom(name, extraSettings)
    if (result) {
      window.sessionStorage.setItem('szafagra.newPartyShare', result.guestToken)
      window.location.href = `${window.location.pathname}?room=${encodeURIComponent(result.roomId)}`
    }
  }

  const handleSeed = async () => {
    setSeeding(true)
    await onSeedRooms()
    setSeeding(false)
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
        <div className="homepage-top">
          <div className="homepage-logo">
            <img src={logoUrl} alt="szafi.fi" className="homepage-logo-img" />
          </div>
          <div className="homepage-header-carousel">
            <div className="homepage-header-dots">
              {[0, 1, 2].map((index) => (
                <button key={index} className={`homepage-header-dot${index === headerSlide ? ' active' : ''}`} onClick={() => setHeaderSlide(index)}>♪</button>
              ))}
            </div>
            <div className="homepage-header-carousel-wrap">
              {[
                { icon: '🎬', text: t('howStep1Desc') },
                { icon: '▶️', text: t('howStep2Desc') },
                { icon: '📱', text: t('howStep3Desc') },
              ].map((slide, index) => (
                <div key={index} className={`homepage-header-slide${index === headerSlide ? ' active' : ''}`}>
                  <span className={`homepage-header-slide-icon homepage-header-slide-icon--tone-${index + 1}`}>{slide.icon}</span>
                  <span className="homepage-header-slide-text">{slide.text}</span>
                </div>
              ))}
            </div>
          </div>
          {isLoggedIn ? (
            <div className="home-user-bar">
              <button className="home-user-avatar-btn" onClick={() => setShowAccountSettings(true)} title={t('accountSettings')}>
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="home-user-avatar" referrerPolicy="no-referrer" />
                  : <div className="home-user-avatar-initials">{(user.displayName || '?')[0].toUpperCase()}</div>
                }
                <span className="home-user-name">{user.displayName}</span>
              </button>
              <button className="home-user-logout" onClick={onSignOut}><span className="home-logout-x">✕</span>{t('signOut')}</button>
            </div>
          ) : (
            <button className="home-google-btn" onClick={onSignIn}>
              <GoogleLogoSvg />
              {t('signInGoogle')}
            </button>
          )}
        </div>

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
            <div className="homepage-col">
              <p className="home-col-title">{t('yourRooms')}</p>
              <div className="home-rooms-list">
                {isLoggedIn ? (
                  ownedRooms.length > 0 ? (
                    ownedRooms.map((ownedRoom) => {
                      const ratingsArr = Object.values(ownedRoom.ratings ?? {})
                      const avgRating = ratingsArr.length > 0
                        ? (ratingsArr.reduce((sum, value) => sum + value, 0) / ratingsArr.length).toFixed(1)
                        : null
                      const isPublic = ownedRoom.type === 'public'

                      return (
                        <a key={ownedRoom.id} className="home-room-card home-room-card--admin" href={`/?room=${ownedRoom.id}`}>
                          <div className="home-room-card-body">
                            <span className="home-room-card-link">
                              {isPublic && <IconEye />}
                              <ScrollText className="home-room-label">{ownedRoom.name || (isPublic ? t('publicRoom') : t('privateRoom'))}</ScrollText>
                            </span>
                            <div className="home-room-stats">
                              <span className="home-room-stat home-room-stat--rating">
                                <span className="home-stat-icon">{'\u2605'}</span>
                                <span className="home-stat-val">{avgRating ?? 0}</span>
                                <span className="home-stat-sub">/{ratingsArr.length}</span>
                              </span>
                              <span className="home-room-stat home-room-stat--songs">
                                <span className="home-stat-icon">{'\u266A'}</span>
                                <span className="home-stat-val">{ownedRoom.songs?.length ?? 0}</span>
                              </span>
                              <span className="home-room-stat home-room-stat--plays">
                                <span className="home-stat-icon">{'\u25B6'}</span>
                                <span className="home-stat-val">{ownedRoom.totalPlays ?? 0}</span>
                              </span>
                              <span className="home-room-stat home-room-stat--votes">
                                <span className="home-stat-icon">{'\u2714'}</span>
                                <span className="home-stat-val">{ownedRoom.totalVotes ?? 0}</span>
                              </span>
                            </div>
                          </div>
                          <button
                            className="home-room-delete"
                            title={t('deleteRoom')}
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              onDeleteRoom(ownedRoom)
                            }}
                          >
                            <IconTrash />
                          </button>
                        </a>
                      )
                    })
                  ) : (
                    <div className="home-no-rooms">
                      <p className="home-no-rooms-hint">{t('noRoomsHint')}</p>
                    </div>
                  )
                ) : (
                  <div className="home-no-rooms">
                    <p className="home-no-rooms-hint">{t('noRoomsHint')}</p>
                  </div>
                )}
              </div>
              {isLoggedIn ? (
                <button className="homepage-btn homepage-btn--primary" onClick={() => setShowPartyWizard(true)} disabled={creatingRoom}>
                  <span className="homepage-btn-icon">{'\u2726'}</span>
                  {creatingRoom ? t('creating') : t('createRoomBtn')}
                </button>
              ) : (
                <p className="home-rooms-empty home-rooms-empty--create-hint">{t('signInToCreate')}</p>
              )}
            </div>

            <div className="homepage-col">
              <div className="home-discover-tabs">
                <button
                  className={`home-discover-tab${discoverTab === 'parties' ? ' active' : ''}`}
                  onClick={() => setDiscoverTab('parties')}
                >
                  {t('nearbyPartiesTab')}
                </button>
                {isLoggedIn && (
                  <button
                    className={`home-discover-tab${discoverTab === 'myVotes' ? ' active' : ''}`}
                    onClick={() => setDiscoverTab('myVotes')}
                  >
                    {t('myRecentVotesTab')}
                  </button>
                )}
              </div>

              {import.meta.env.DEV && discoverTab === 'toprated' && (
                <button className="home-seed-btn" onClick={handleSeed} disabled={seeding}>
                  {seeding ? t('creating') : t('generateSampleLists')}
                </button>
              )}

              {discoverTab === 'parties' && (
                <div className="nearby-filter-row">
                  {nearbyRef ? (
                    <div className="nearby-active">
                      <span className="nearby-active-label">{'\uD83D\uDCCD'} {nearbyRef.name}</span>
                      <button className="nearby-clear-btn" onClick={clearNearby}>&#x2715;</button>
                    </div>
                  ) : (
                    <>
                      <input
                        className="nearby-input"
                        type="text"
                        placeholder={t('nearbyPlaceholder')}
                        value={nearbyInput}
                        onChange={(event) => setNearbyInput(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && handleNearbySearch()}
                        disabled={nearbyLoading}
                      />
                      <button className="nearby-search-btn" onClick={() => handleNearbySearch()} disabled={nearbyLoading || !nearbyInput.trim()}>
                        {nearbyLoading ? '…' : t('nearbySearchBtn')}
                      </button>
                      <button className="nearby-gps-btn" onClick={handleNearbyGps} disabled={nearbyLoading} title={t('useMyLocation')}>
                        {'\uD83D\uDCCD'}
                      </button>
                    </>
                  )}
                  {nearbyError && <span className="nearby-error">{nearbyError}</span>}
                </div>
              )}

              <div className="home-rooms-list">
                {discoverTab === 'parties' && (
                  partiesWithDistance.length > 0 ? (
                    partiesWithDistance.map((party) => {
                      const date = party.settings?.partyDate
                      const location = party.settings?.partyLocation
                      const interestCount = Object.keys(party.eventInterest ?? {}).length
                      const formattedDate = date
                        ? new Date(date).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })
                        : null

                      return (
                        <button
                          key={party.id}
                          className="home-room-card home-room-card--clickable home-room-card--party"
                          onClick={() => handleOpenPartyPreview(party)}
                        >
                          <div className="home-room-card-body">
                            <div className="home-party-title-row">
                              <span className="home-party-interest-badge">{'\uD83D\uDC64'} {interestCount}</span>
                              <ScrollText className="home-room-label">{party.name || t('defaultRoomName')}</ScrollText>
                            </div>
                            <div className="home-party-meta">
                              {formattedDate && location ? (
                                <span className="home-party-date">{'\uD83D\uDCC5'} {formattedDate} {'\u2022'} {'\uD83D\uDCCD'} {location}</span>
                              ) : (
                                <>
                                  {formattedDate && <span className="home-party-date">{'\uD83D\uDCC5'} {formattedDate}</span>}
                                  {location && <span className="home-party-location">{'\uD83D\uDCCD'} {location}</span>}
                                </>
                              )}
                              {party._dist != null && <span className="home-party-dist">{party._dist < 1 ? '< 1 km' : `${Math.round(party._dist)} km`}</span>}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <p className="home-rooms-empty">{nearbyRef ? t('noPartiesNearby') : t('noUpcomingParties')}</p>
                  )
                )}

                {discoverTab === 'toprated' && (
                  topRatedRooms.length > 0 ? (
                    topRatedRooms.map((room, index) => (
                      <button
                        key={room.id}
                        className="home-room-card home-room-card--clickable"
                        onClick={() => setPreviewRoomId(room.id)}
                      >
                        <div className="home-room-card-body">
                          <span className="home-room-card-link">
                            <span className="home-toprated-rank">#{index + 1}</span>
                            <ScrollText className="home-room-label">{room.name || t('defaultRoomName')}</ScrollText>
                          </span>
                          <div className="home-room-stats">
                            <span className="home-room-stat home-room-stat--rating">
                              <span className="home-stat-icon">{'\u2605'}</span>
                              <span className="home-stat-val">{room._avgRating.toFixed(1)}</span>
                              <span className="home-stat-sub">/{room._ratingCount}</span>
                            </span>
                            <span className="home-room-stat home-room-stat--songs">
                              <span className="home-stat-icon">{'\u266A'}</span>
                              <span className="home-stat-val">{room.songs?.length ?? 0}</span>
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="home-rooms-empty">{t('noTopRatedRooms')}</p>
                  )
                )}

                {discoverTab === 'myVotes' && (
                  (guestVisitedRooms ?? []).length > 0 ? (
                    (guestVisitedRooms ?? []).map((room) => (
                      <button
                        key={room.id}
                        className="home-room-card home-room-card--clickable"
                        onClick={() => onJoinRoom(room.guestToken)}
                      >
                        <div className="home-room-card-body">
                          <ScrollText className="home-room-label">{room.name || t('defaultRoomName')}</ScrollText>
                          <div className="home-room-stats">
                            <span className="home-room-stat home-room-stat--songs">
                              <span className="home-stat-icon">{'\u266A'}</span>
                              <span className="home-stat-val">{room.songs?.length ?? 0}</span>
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="home-rooms-empty">{t('noGuestVisitedRooms')}</p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <footer className="homepage-footer">
          <ContactMessageForm
            triggerClassName="homepage-footer-btn"
            triggerLabel={'✉️ ' + t('writeMessage')}
            title={t('writeMessageToCreators')}
            submitLabel={t('send')}
            successMessage={t('thanksSaved')}
            panelClassName="homepage-contact-form"
            onSubmit={(payload) => onSubmitMessage?.({ ...payload, source: 'homepage' })}
          />
          <button className="homepage-footer-btn" onClick={onOpenCookieSettings}>🍪 {t('cookieSettings')}</button>
          <a className="homepage-footer-btn" href="/privacy.html" target="_blank" rel="noreferrer">🔒 {t('privacy')}</a>
          <a className="homepage-footer-btn" href="/terms.html" target="_blank" rel="noreferrer">📄 {t('terms')}</a>
          <button className="homepage-footer-btn" onClick={toggleLang}>{t('langToggle')}</button>
        </footer>
      </div>

      {previewRoom && (
        <Suspense fallback={null}>
          <LazyTopRatedRoomPreviewModal
            room={previewRoom}
            ownedRooms={ownedRooms}
            isLoggedIn={isLoggedIn}
            t={t}
            onClose={() => setPreviewRoomId(null)}
            onPreviewRoom={onPreviewRoom}
            onCopyForeignRoom={onCopyForeignRoom}
            onAppendForeignToRoom={onAppendForeignToRoom}
          />
        </Suspense>
      )}

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
            onCreateRoomFromYt={onCreateRoomFromYt}
            onAddYtToRoom={onAddYtToRoom}
            currentRoomId={null}
            ownedRooms={ownedRooms}
          />
        </Suspense>
      )}
    </>
  )
}
