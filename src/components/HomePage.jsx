import { useState } from 'react'
import { ScrollText } from './ScrollText.jsx'
import { useLanguage } from '../context/LanguageContext'
import { UserProfileModal } from './UserProfileModal.jsx'

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
}) {
  const { t, lang, toggleLang } = useLanguage()
  const [roomInput, setRoomInput] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [previewRoom, setPreviewRoom] = useState(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const isLoggedIn = user && !user.isAnonymous

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
        <div className="homepage-top-left">
          <div className="homepage-logo">
            <span className="homepage-logo-icon"><IconMusic /></span>
            <span className="header-logo">szafi.fi</span>
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
              <button className="home-user-link" onClick={onOpenCookieSettings}>{t('cookies')}</button>
              <button className="lang-toggle" onClick={toggleLang}>{t('langToggle')}</button>
              <button className="home-user-logout" onClick={onSignOut}>{t('signOut')}</button>
            </div>
          ) : (
            <div className="home-google-signin">
              <button className="home-google-btn" onClick={onSignIn}>
                <GoogleLogoSvg />
                {t('signInGoogle')}
              </button>
              <p className="home-google-hint">{t('toSeePrivateRooms')}</p>
              <button className="home-cookie-link" onClick={onOpenCookieSettings}>{t('cookieSettings')}</button>
              <button className="lang-toggle" onClick={toggleLang}>{t('langToggle')}</button>
            </div>
          )}
        </div>
        <div className="homepage-top-right">
          <button className="home-how-it-works" disabled>
            {t('howItWorks')}
          </button>
        </div>
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
                  <p className="home-rooms-empty">{t('noRoomsYet')}</p>
                )
              ) : (
                <p className="home-rooms-empty">{t('signInToSeeRooms')}</p>
              )}
            </div>
            {isLoggedIn ? (
              <button className="homepage-btn homepage-btn--primary" onClick={onCreateRoom} disabled={creatingRoom}>
                <span className="homepage-btn-icon">{'\u2726'}</span>
                {creatingRoom ? t('creating') : t('createNewRoom')}
              </button>
            ) : (
              <p className="home-rooms-empty home-rooms-empty--create-hint">{t('signInToCreate')}</p>
            )}
          </div>

          <div className="homepage-col">
            <p className="home-col-title">{t('recentLists')}</p>
            {import.meta.env.DEV && (
              <button className="home-seed-btn" onClick={handleSeed} disabled={seeding}>
                {seeding ? t('creating') : t('generateSampleLists')}
              </button>
            )}
            <div className="home-rooms-list">
              {isLoggedIn ? (
                latestForeignRooms.length > 0 ? (
                  latestForeignRooms.map((recentRoom) => {
                    const ratingsArr = Object.values(recentRoom.ratings ?? {})
                    const avgRating = ratingsArr.length > 0
                      ? (ratingsArr.reduce((sum, value) => sum + value, 0) / ratingsArr.length).toFixed(1)
                      : null

                    return (
                      <button
                        key={recentRoom.id}
                        className="home-room-card home-room-card--clickable"
                        onClick={() => setPreviewRoom(recentRoom)}
                      >
                        <div className="home-room-card-link">
                          <ScrollText className="home-room-label">{recentRoom.name || t('defaultRoomName')}</ScrollText>
                        </div>
                        <div className="home-room-stats">
                          <span className="home-room-stat home-room-stat--rating">
                            <span className="home-stat-icon">{'\u2605'}</span>
                            <span className="home-stat-val">{avgRating ?? 0}</span>
                            <span className="home-stat-sub">/{ratingsArr.length}</span>
                          </span>
                          <span className="home-room-stat home-room-stat--songs">
                            <span className="home-stat-icon">{'\u266A'}</span>
                            <span className="home-stat-val">{recentRoom.songs?.length ?? 0}</span>
                          </span>
                          <span className="home-room-stat home-room-stat--plays">
                            <span className="home-stat-icon">{'\u25B6'}</span>
                            <span className="home-stat-val">{recentRoom.totalPlays ?? 0}</span>
                          </span>
                          <span className="home-room-stat home-room-stat--votes">
                            <span className="home-stat-icon">{'\u2714'}</span>
                            <span className="home-stat-val">{recentRoom.totalVotes ?? 0}</span>
                          </span>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <p className="home-rooms-empty">{t('noListsToShow')}</p>
                )
              ) : (
                <p className="home-rooms-empty">{t('signInToSeeRecentRooms')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
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
                  <div className="room-preview-append-list">
                    <span className="room-preview-append-label">{t('addTo')}</span>
                    {ownedRooms.map((ownedRoom) => (
                      <button
                        key={ownedRoom.id}
                        className="room-preview-btn room-preview-btn--append"
                        disabled={previewBusy}
                        onClick={async () => {
                          setPreviewBusy(true)
                          await onAppendForeignToRoom(ownedRoom.id, previewRoom.songs ?? [])
                          setPreviewBusy(false)
                          setPreviewRoom(null)
                        }}
                      >
                        {ownedRoom.name || t('privateRoom')}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
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
