import { useState, useRef, useEffect } from 'react'
import { ScrollText } from './ScrollText.jsx'
import { useLanguage } from '../context/LanguageContext'
import { UserProfileModal } from './UserProfileModal.jsx'
import { ContactMessageForm } from './ContactMessageForm.jsx'
import { toggleEventInterest } from '../services/jukeboxService.js'
import logoUrl from '../assets/logo.png'

function getVisitorId() {
  let id = localStorage.getItem('szafagra_vid')
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    localStorage.setItem('szafagra_vid', id)
  }
  return id
}

async function nominatimGeocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'pl,en' } })
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name.split(',')[0].trim() }
}

async function nominatimReverse(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  const res = await fetch(url, { headers: { 'Accept-Language': 'pl,en' } })
  const data = await res.json()
  return data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(',')[0] || ''
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function PartyPreviewModal({ party, partySearch, setPartySearch, partyShowThumbs, setPartyShowThumbs, onClose, lang, t }) {
  const visitorId = getVisitorId()
  const interested = !!(party.eventInterest?.[visitorId])
  const interestCount = Object.keys(party.eventInterest ?? {}).length
  const date = party.settings?.partyDate
  const location = party.settings?.partyLocation
  const description = party.settings?.partyDescription
  const formatted = date
    ? new Date(date).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null
  const songs = party.songs ?? []
  const filtered = partySearch.trim()
    ? songs.filter(s => s.title?.toLowerCase().includes(partySearch.toLowerCase()))
    : songs

  return (
    <div className="room-preview-overlay" role="presentation" onClick={onClose}>
      <div className="party-preview-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="party-preview-header">
          <span className="room-preview-title">{party.name || t('defaultRoomName')}</span>
          <button className="room-preview-close" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="party-preview-meta">
          {formatted && <span className="party-preview-date">{'\uD83D\uDCC5'} {formatted}</span>}
          {location && (
            <a
              className="party-preview-location"
              href={`https://www.google.com/maps/search/${encodeURIComponent(location)}`}
              target="_blank"
              rel="noreferrer"
            >
              {'\uD83D\uDCCD'} {location}
            </a>
          )}
          {description && <p className="party-preview-desc">{description}</p>}
        </div>

        <div className="party-preview-controls">
          <input
            className="party-preview-search"
            type="text"
            placeholder={t('partySearchPlaceholder')}
            value={partySearch}
            onChange={(e) => setPartySearch(e.target.value)}
          />
          <button
            className={`party-preview-thumbs-btn${partyShowThumbs ? ' active' : ''}`}
            onClick={() => setPartyShowThumbs(v => !v)}
          >
            {'\uD83D\uDDBC'} {t('showThumbnailsBtn')}
          </button>
        </div>

        <div className="room-preview-songs">
          {filtered.length === 0
            ? <p className="party-preview-empty">{t('noResultsFor')} &ldquo;{partySearch}&rdquo;</p>
            : filtered.map((song, i) => (
              <div key={song.id ?? i} className={`room-preview-song${partyShowThumbs ? ' room-preview-song--thumb' : ''}`}>
                {partyShowThumbs && song.ytId && (
                  <img
                    src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`}
                    alt=""
                    className="party-preview-thumb"
                  />
                )}
                <span className="room-preview-song-num">{i + 1}</span>
                <span className="room-preview-song-title">{song.title}</span>
              </div>
            ))
          }
        </div>

        <div className="party-preview-footer">
          {interestCount > 0 && (
            <span className="party-preview-interest-count">{t('interestedCount', interestCount)}</span>
          )}
          <button
            className={`party-preview-interest-btn${interested ? ' active' : ''}`}
            onClick={() => toggleEventInterest(party.id, visitorId, interested)}
          >
            {interested ? t('notInterestedBtn') : t('interestedBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}

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
  latestForeignRooms,
  upcomingOpenParties,
  topRatedRooms,
  onCreateRoom,
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
  const [previewRoom, setPreviewRoom] = useState(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const [appendRoomId, setAppendRoomId] = useState('')
  const [discoverTab, setDiscoverTab] = useState('parties')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPartyConfig, setShowPartyConfig] = useState(false)
  const [partyUnlimited, setPartyUnlimited] = useState(true)
  const [partySuggestionsLimit, setPartySuggestionsLimit] = useState(5)
  const [partyRequireLogin, setPartyRequireLogin] = useState(true)
  const [headerSlide, setHeaderSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setHeaderSlide(s => (s + 1) % 3), 2800)
    return () => clearInterval(timer)
  }, [])
  const [previewParty, setPreviewParty] = useState(null)
  const [partySearch, setPartySearch] = useState('')
  const [partyShowThumbs, setPartyShowThumbs] = useState(false)

  const [nearbyInput, setNearbyInput] = useState('')
  const [nearbyRef, setNearbyRef] = useState(null) // { lat, lng, name }
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState('')
  const [, setCoordsTick] = useState(0)
  const partyCoords = useRef({}) // cache: locationString → {lat,lng} | null

  const handleNearbySearch = async (query = nearbyInput) => {
    const q = query.trim()
    if (!q) return
    setNearbyLoading(true)
    setNearbyError('')
    try {
      const result = await nominatimGeocode(q)
      if (result) setNearbyRef(result)
      else setNearbyError(t('geocodingFailed'))
    } catch {
      setNearbyError(t('geocodingFailed'))
    }
    setNearbyLoading(false)
  }

  const handleNearbyGps = () => {
    if (!navigator.geolocation) { setNearbyError(t('gpsNotSupported')); return }
    setNearbyLoading(true)
    setNearbyError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const name = await nominatimReverse(latitude, longitude).catch(() => t('myLocation'))
        setNearbyRef({ lat: latitude, lng: longitude, name })
        setNearbyLoading(false)
      },
      () => { setNearbyError(t('gpsError')); setNearbyLoading(false) }
    )
  }

  const clearNearby = () => { setNearbyRef(null); setNearbyInput(''); setNearbyError('') }

  useEffect(() => {
    if (!nearbyRef) return
    let cancelled = false
    const toGeocode = upcomingOpenParties
      .map(p => p.settings?.partyLocation)
      .filter(Boolean)
      .filter(loc => partyCoords.current[loc] === undefined)
    if (!toGeocode.length) return
    ;(async () => {
      for (const loc of toGeocode) {
        if (cancelled) break
        try {
          const r = await nominatimGeocode(loc)
          partyCoords.current[loc] = r
        } catch {
          partyCoords.current[loc] = null
        }
        await new Promise(r => setTimeout(r, 350))
      }
      if (!cancelled) setCoordsTick(v => v + 1)
    })()
    return () => { cancelled = true }
  }, [nearbyRef, upcomingOpenParties])

  const partiesWithDistance = nearbyRef
    ? upcomingOpenParties
        .map(p => {
          const coords = partyCoords.current[p.settings?.partyLocation]
          const dist = coords ? haversineKm(nearbyRef.lat, nearbyRef.lng, coords.lat, coords.lng) : null
          return { ...p, _dist: dist }
        })
        .sort((a, b) => {
          if (a._dist == null && b._dist == null) return 0
          if (a._dist == null) return 1
          if (b._dist == null) return -1
          return a._dist - b._dist
        })
    : upcomingOpenParties
  const isLoggedIn = user && !user.isAnonymous

  const handleCreate = async (roomMode) => {
    setShowCreateModal(false)
    await onCreateRoom(roomMode)
  }

  const handleCreateParty = async () => {
    setShowPartyConfig(false)
    await onCreateRoom('party_prep', {
      allowSuggestions: true,
      suggestionsPerUser: partyUnlimited ? null : partySuggestionsLimit,
      suggestionsRequireLogin: partyUnlimited ? true : partyRequireLogin,
    })
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

  return (
    <>
    <div className="homepage">
      <div className="homepage-top">
        <div className="homepage-logo">
          <img src={logoUrl} alt="Szafagra" className="homepage-logo-img" />
        </div>
        <div className="homepage-header-carousel">
          <div className="homepage-header-dots">
            {[0, 1, 2].map(i => (
              <button key={i} className={`homepage-header-dot${i === headerSlide ? ' active' : ''}`} onClick={() => setHeaderSlide(i)}>♪</button>
            ))}
          </div>
          <div className="homepage-header-carousel-wrap">
            {[
              { icon: '🎬', text: t('howStep1Desc') },
              { icon: '▶️', text: t('howStep2Desc') },
              { icon: '📱', text: t('howStep3Desc') },
            ].map((slide, i) => (
              <div key={i} className={`homepage-header-slide${i === headerSlide ? ' active' : ''}`}>
                <span className="homepage-header-slide-icon">{slide.icon}</span>
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
                      ? (ratingsArr.reduce((sum, v) => sum + v, 0) / ratingsArr.length).toFixed(1)
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
              <button className="homepage-btn homepage-btn--primary" onClick={() => setShowCreateModal(true)} disabled={creatingRoom}>
                <span className="homepage-btn-icon">{'\u2726'}</span>
                {creatingRoom ? t('creating') : t('createNewRoom')}
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
              <button
                className={`home-discover-tab${discoverTab === 'toprated' ? ' active' : ''}`}
                onClick={() => setDiscoverTab('toprated')}
              >
                {t('topRatedTab')}
              </button>
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
                      onChange={e => setNearbyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNearbySearch()}
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
                    const description = party.settings?.partyDescription
                    const interestCount = Object.keys(party.eventInterest ?? {}).length
                    const formatted = date ? new Date(date).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' }) : null

                    return (
                      <button
                        key={party.id}
                        className="home-room-card home-room-card--clickable home-room-card--party"
                        onClick={() => { setPreviewParty(party); setPartySearch('') }}
                      >
                        <div className="home-room-card-body">
                          <ScrollText className="home-room-label">{party.name || t('defaultRoomName')}</ScrollText>
                          <div className="home-party-meta">
                            {formatted && <span className="home-party-date">{'\uD83D\uDCC5'} {formatted}</span>}
                            {location && <span className="home-party-location">{'\uD83D\uDCCD'} {location}</span>}
                            {party._dist != null && <span className="home-party-dist">{party._dist < 1 ? '< 1 km' : `${Math.round(party._dist)} km`}</span>}
                            {description && <span className="home-party-desc">{description}</span>}
                            {interestCount > 0 && <span className="home-party-interest">{t('interestedCount', interestCount)}</span>}
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
                  topRatedRooms.map((room, i) => (
                    <button
                      key={room.id}
                      className="home-room-card home-room-card--clickable"
                      onClick={() => setPreviewRoom(room)}
                    >
                      <div className="home-room-card-body">
                        <span className="home-room-card-link">
                          <span className="home-toprated-rank">#{i + 1}</span>
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
            </div>
          </div>
        </div>
      </div>

      <footer className="homepage-footer">
        <ContactMessageForm
          triggerClassName="homepage-footer-btn"
          triggerLabel={t('writeMessage')}
          title={t('writeMessageToCreators')}
          submitLabel={t('send')}
          successMessage={t('thanksSaved')}
          panelClassName="homepage-contact-form"
          onSubmit={(payload) => onSubmitMessage?.({ ...payload, source: 'homepage' })}
        />
        <button className="homepage-footer-btn" onClick={onOpenCookieSettings}>{t('cookieSettings')}</button>
        <a className="homepage-footer-btn" href="/privacy.html" target="_blank" rel="noreferrer">{t('privacy')}</a>
        <button className="homepage-footer-btn" onClick={toggleLang}>{t('langToggle')}</button>
      </footer>
    </div>

    {previewRoom && (
      <div className="room-preview-overlay" role="presentation" onClick={() => setPreviewRoom(null)}>
        <div className="room-preview-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <div className="room-preview-header">
            <div className="room-preview-header-info">
              <span className="room-preview-title">{previewRoom.name || t('defaultRoomName')}</span>
              <span className="room-preview-count">{t('songCount', previewRoom.songs?.length ?? 0)}</span>
            </div>
            <button className="room-preview-close" onClick={() => setPreviewRoom(null)}>✕</button>
          </div>
          <div className="room-preview-songs">
            {(previewRoom.songs ?? []).map((song, i) => (
              <div key={song.id ?? i} className="room-preview-song">
                <span className="room-preview-song-num">{i + 1}</span>
                <span className="room-preview-song-title">{song.title}</span>
              </div>
            ))}
          </div>
          <div className="room-preview-actions">
            <button
              className="room-preview-btn room-preview-btn--enter"
              onClick={() => { setPreviewRoom(null); onPreviewRoom(previewRoom.id) }}
            >
              {t('enterRoom')}
            </button>
            {isLoggedIn && (
              <>
                <button
                  className="room-preview-btn room-preview-btn--copy"
                  disabled={previewBusy}
                  onClick={async () => {
                    setPreviewBusy(true)
                    await onCopyForeignRoom(previewRoom)
                    setPreviewBusy(false)
                    setPreviewRoom(null)
                  }}
                >
                  {previewBusy ? t('creating') : t('copyToNew')}
                </button>
                {ownedRooms.length > 0 && (
                  <div className="room-preview-append-row">
                    <select
                      className="room-preview-append-select"
                      value={appendRoomId}
                      onChange={(e) => setAppendRoomId(e.target.value)}
                      disabled={previewBusy}
                    >
                      <option value="">{t('addTo')}</option>
                      {ownedRooms.map((ownedRoom) => (
                        <option key={ownedRoom.id} value={ownedRoom.id}>
                          {ownedRoom.name || t('privateRoom')}
                        </option>
                      ))}
                    </select>
                    {appendRoomId && (
                      <button
                        className="room-preview-btn room-preview-btn--copy"
                        disabled={previewBusy}
                        onClick={async () => {
                          setPreviewBusy(true)
                          await onAppendForeignToRoom(appendRoomId, previewRoom.songs ?? [])
                          setPreviewBusy(false)
                          setPreviewRoom(null)
                        }}
                      >
                        {previewBusy ? t('creating') : '+ Dodaj'}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )}

    {previewParty && <PartyPreviewModal
      party={upcomingOpenParties.find(p => p.id === previewParty.id) ?? previewParty}
      partySearch={partySearch}
      setPartySearch={setPartySearch}
      partyShowThumbs={partyShowThumbs}
      setPartyShowThumbs={setPartyShowThumbs}
      onClose={() => setPreviewParty(null)}
      lang={lang}
      t={t}
    />}

    {showCreateModal && (
      <div className="create-room-overlay" onClick={() => setShowCreateModal(false)}>
        <div className="create-room-modal" onClick={(e) => e.stopPropagation()}>
          <div className="create-room-header">
            <span className="create-room-title">{t('createNewRoom')}</span>
            <button className="create-room-close" onClick={() => setShowCreateModal(false)}>✕</button>
          </div>
          <div className="create-room-options">
            <button className="create-room-option" onClick={() => { setShowCreateModal(false); setShowPartyConfig(true) }} disabled={creatingRoom}>
              <span className="create-room-option-icon">🎉</span>
              <div className="create-room-option-text">
                <span className="create-room-option-name">{t('createPartyPrep')}</span>
                <span className="create-room-option-desc">{t('createPartyPrepDesc')}</span>
              </div>
            </button>
            <button className="create-room-option" onClick={() => handleCreate('party')} disabled={creatingRoom}>
              <span className="create-room-option-icon">🎵</span>
              <div className="create-room-option-text">
                <span className="create-room-option-name">{t('createParty')}</span>
                <span className="create-room-option-desc">{t('createPartyDesc')}</span>
              </div>
            </button>
            <button className="create-room-option" onClick={() => handleCreate('player')} disabled={creatingRoom}>
              <span className="create-room-option-icon">▶</span>
              <div className="create-room-option-text">
                <span className="create-room-option-name">{t('createPlayer')}</span>
                <span className="create-room-option-desc">{t('createPlayerDesc')}</span>
              </div>
            </button>
          </div>
          <p className="create-room-footnote">{t('createRoomFootnote')}</p>
        </div>
      </div>
    )}

    {showPartyConfig && (
      <div className="create-room-overlay" onClick={() => { setShowPartyConfig(false); setShowCreateModal(true) }}>
        <div className="party-config-modal" onClick={e => e.stopPropagation()}>
          <div className="create-room-header">
            <span className="create-room-title">{t('partyConfigTitle')}</span>
            <button className="create-room-close" onClick={() => { setShowPartyConfig(false); setShowCreateModal(true) }}>✕</button>
          </div>

          <div className="party-config-body">
            <label className="party-config-label">{t('partyConfigMaxSuggestionsLabel')}</label>

            <div className="party-config-row">
              <input
                type="checkbox"
                id="party-unlimited"
                checked={partyUnlimited}
                onChange={e => {
                  setPartyUnlimited(e.target.checked)
                  if (e.target.checked) setPartyRequireLogin(true)
                }}
              />
              <label htmlFor="party-unlimited">{t('partyConfigUnlimited')}</label>
            </div>

            {!partyUnlimited && (
              <div className="party-config-slider-row">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={partySuggestionsLimit}
                  onChange={e => setPartySuggestionsLimit(Number(e.target.value))}
                  className="party-config-slider"
                />
                <span className="party-config-slider-val">{partySuggestionsLimit}</span>
              </div>
            )}

            <div className="party-config-row">
              <input
                type="checkbox"
                id="party-require-login"
                checked={partyUnlimited ? true : partyRequireLogin}
                disabled={partyUnlimited}
                onChange={e => setPartyRequireLogin(e.target.checked)}
              />
              <label htmlFor="party-require-login" className={partyUnlimited ? 'party-config-label--dim' : ''}>
                {t('partyConfigRequireLogin')}
              </label>
            </div>
          </div>

          <div className="party-config-footer">
            <button className="party-config-btn party-config-btn--back" onClick={() => { setShowPartyConfig(false); setShowCreateModal(true) }}>
              {t('partyConfigBack')}
            </button>
            <button className="party-config-btn party-config-btn--create" onClick={handleCreateParty} disabled={creatingRoom}>
              {creatingRoom ? t('creating') : t('partyConfigCreate')}
            </button>
          </div>
        </div>
      </div>
    )}

    {showAccountSettings && isLoggedIn && (
      <UserProfileModal
        user={user}
        onClose={() => setShowAccountSettings(false)}
        onUpdateDisplayName={onUpdateDisplayName}
        onCreateRoomFromYt={onCreateRoomFromYt}
        onAddYtToRoom={onAddYtToRoom}
        currentRoomId={null}
        ownedRooms={ownedRooms}
      />
    )}
    </>
  )
}
