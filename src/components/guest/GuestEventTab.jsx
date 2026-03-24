export function GuestEventTab({ partyDate, partyLocation, partyDescription, lang, t }) {
  const formattedDate = partyDate
    ? new Date(partyDate).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null

  return (
    <div className="guest-tab-panel">
      <div className="guest-event-info">
        {formattedDate && (
          <div className="guest-event-row">
            <span className="guest-event-label">{t('eventDateLabel')}</span>
            <span className="guest-event-value">📅 {formattedDate}</span>
          </div>
        )}
        {partyLocation && (
          <div className="guest-event-row">
            <span className="guest-event-label">{t('eventLocationLabel')}</span>
            <a
              className="guest-event-value guest-event-location-link"
              href={`https://www.google.com/maps/search/${encodeURIComponent(partyLocation)}`}
              target="_blank"
              rel="noreferrer"
            >
              📍 {partyLocation}
            </a>
          </div>
        )}
        {partyDescription && (
          <div className="guest-event-row">
            <span className="guest-event-label">{t('eventDescLabel')}</span>
            <span className="guest-event-value">{partyDescription}</span>
          </div>
        )}
      </div>
    </div>
  )
}
