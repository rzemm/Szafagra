import { ScrollText } from '../ScrollText'

const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14 8.46 11.88zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)

const IconEye = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.55 }}>
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
  </svg>
)

export function HomeOwnedRoomsSection({
  ownedRooms,
  isLoggedIn,
  creatingRoom,
  onDeleteRoom,
  onOpenPartyWizard,
  t,
}) {
  return (
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
        <button className="homepage-btn homepage-btn--primary" onClick={onOpenPartyWizard} disabled={creatingRoom}>
          <span className="homepage-btn-icon">{'\u2726'}</span>
          {creatingRoom ? t('creating') : t('createRoomBtn')}
        </button>
      ) : (
        <p className="home-rooms-empty home-rooms-empty--create-hint">{t('signInToCreate')}</p>
      )}
    </div>
  )
}
