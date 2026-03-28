import { ScrollText } from '../ScrollText'

export function HomeDiscoverSection({
  discoverTab,
  onSetDiscoverTab,
  isLoggedIn,
  nearbyInput,
  nearbyRef,
  nearbyLoading,
  nearbyError,
  partiesWithDistance,
  guestVisitedRooms,
  onSetNearbyInput,
  onClearNearby,
  onNearbySearch,
  onNearbyGps,
  onOpenPartyPreview,
  onJoinRoom,
  lang,
  t,
}) {
  return (
    <div className="homepage-col">
      <div className="home-discover-tabs">
        <button
          className={`home-discover-tab${discoverTab === 'parties' ? ' active' : ''}`}
          onClick={() => onSetDiscoverTab('parties')}
        >
          {t('nearbyPartiesTab')}
        </button>
        {isLoggedIn && (
          <button
            className={`home-discover-tab${discoverTab === 'myVotes' ? ' active' : ''}`}
            onClick={() => onSetDiscoverTab('myVotes')}
          >
            {t('myRecentVotesTab')}
          </button>
        )}
      </div>

      {discoverTab === 'parties' && (
        <div className="nearby-filter-row">
          {nearbyRef ? (
            <div className="nearby-active">
              <span className="nearby-active-label">{'\uD83D\uDCCD'} {nearbyRef.name}</span>
              <button className="nearby-clear-btn" onClick={onClearNearby}>&#x2715;</button>
            </div>
          ) : (
            <>
              <input
                className="nearby-input"
                type="text"
                placeholder={t('nearbyPlaceholder')}
                value={nearbyInput}
                onChange={(event) => onSetNearbyInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && onNearbySearch()}
                disabled={nearbyLoading}
              />
              <button className="nearby-search-btn" onClick={onNearbySearch} disabled={nearbyLoading || !nearbyInput.trim()}>
                {nearbyLoading ? '...' : t('nearbySearchBtn')}
              </button>
              <button className="nearby-gps-btn" onClick={onNearbyGps} disabled={nearbyLoading} title={t('useMyLocation')}>
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
                  onClick={() => onOpenPartyPreview(party)}
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

        {discoverTab === 'myVotes' && (
          guestVisitedRooms.length > 0 ? (
            guestVisitedRooms.map((room) => (
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
  )
}
