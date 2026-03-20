import { useState } from 'react'
import { ScrollText } from './ScrollText.jsx'

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
}) {
  const [roomInput, setRoomInput] = useState('')
  const [seeding, setSeeding] = useState(false)
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
    <div className="homepage">
      <div className="homepage-top">
        <div className="homepage-logo">
          <span className="homepage-logo-icon">đźŽµ</span>
          <span className="header-logo">szafi.fi</span>
        </div>
        {isLoggedIn ? (
          <div className="home-user-bar">
            {user.photoURL && <img src={user.photoURL} alt="" className="home-user-avatar" referrerPolicy="no-referrer" />}
            <span className="home-user-name">{user.displayName}</span>
            <button className="home-user-logout" onClick={onSignOut}>Wyloguj</button>
          </div>
        ) : (
          <div className="home-google-signin">
            <button className="home-google-btn" onClick={onSignIn}>
              <GoogleLogoSvg />
              Zaloguj sie przez Google
            </button>
            <p className="home-google-hint">aby zobaczyc swoje prywatne pokoje</p>
          </div>
        )}
      </div>

      <div className="homepage-body">
        <div className="homepage-join-row">
          <input
            className="homepage-join-input"
            type="text"
            placeholder="Wklej link, token albo ID pokoju..."
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleJoin()}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="homepage-btn homepage-btn--join"
            onClick={handleJoin}
            disabled={!roomInput.trim()}
          >
            Dolacz
          </button>
        </div>

        <div className="homepage-cols-row">
          <div className="homepage-col">
            <p className="home-col-title">Twoje pokoje</p>
            <div className="home-rooms-list">
              {isLoggedIn ? (
                ownedRooms.length > 0 ? (
                  ownedRooms.map((ownedRoom) => (
                    <div key={ownedRoom.id} className={`home-room-card home-room-card--admin${ownedRoom.isPlaying ? ' home-room-card--playing' : ''}`}>
                      <a className="home-room-card-link" href={`/?room=${ownedRoom.id}`}>
                        <span className="home-room-icon">đźŽ›</span>
                        <ScrollText className="home-room-label">{ownedRoom.name || 'Pokoj prywatny'}</ScrollText>
                      </a>
                      <button
                        className="home-room-delete"
                        title="Usun pokoj"
                        onClick={(event) => {
                          event.preventDefault()
                          onDeleteRoom(ownedRoom)
                        }}
                      >
                        đź—‘
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="home-rooms-empty">Nie masz jeszcze zadnych pokojow</p>
                )
              ) : (
                <p className="home-rooms-empty">Zaloguj sie, aby zobaczyc swoje pokoje</p>
              )}
            </div>
            <button className="homepage-btn homepage-btn--primary" onClick={onCreateRoom} disabled={creatingRoom}>
              <span className="homepage-btn-icon">âś¦</span>
              {creatingRoom ? 'Tworzenie...' : 'Utworz nowy pokoj'}
            </button>
          </div>

          <div className="homepage-col">
            <p className="home-col-title">Ostatnie listy</p>
            {import.meta.env.DEV && (
              <button className="home-seed-btn" onClick={handleSeed} disabled={seeding}>
                {seeding ? 'Tworzenie...' : '+ Wygeneruj przykladowe listy'}
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
                      <a
                        key={recentRoom.id}
                        className={`home-room-card${recentRoom.isPlaying ? ' home-room-card--playing' : ''}`}
                        href={`/?room=${recentRoom.id}`}
                        onClick={(event) => {
                          event.preventDefault()
                          onPreviewRoom(recentRoom.id)
                        }}
                      >
                        <div className="home-room-card-link">
                          <ScrollText className="home-room-label">{recentRoom.name || 'Lista'}</ScrollText>
                        </div>
                        <div className="home-room-stats">
                          {avgRating !== null && (
                            <span className="home-room-stat home-room-stat--rating">
                              <span className="home-stat-icon">â…</span>
                              <span className="home-stat-val">{avgRating}</span>
                              <span className="home-stat-sub">/{ratingsArr.length}</span>
                            </span>
                          )}
                          <span className="home-room-stat">
                            <span className="home-stat-icon">â–¶</span>
                            <span className="home-stat-val">{recentRoom.totalPlays ?? 0}</span>
                          </span>
                          <span className="home-room-stat">
                            <span className="home-stat-icon">âś”</span>
                            <span className="home-stat-val">{recentRoom.totalVotes ?? 0}</span>
                          </span>
                          <span className="home-room-stat">
                            <span className="home-stat-icon">â™Ş</span>
                            <span className="home-stat-val">{recentRoom.songs?.length ?? 0}</span>
                          </span>
                        </div>
                      </a>
                    )
                  })
                ) : (
                  <p className="home-rooms-empty">Brak list do pokazania</p>
                )
              ) : (
                <p className="home-rooms-empty">Zaloguj sie, aby zobaczyc ostatnie listy</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
