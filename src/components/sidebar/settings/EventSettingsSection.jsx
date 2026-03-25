export function EventSettingsSection({
  canEditRoom,
  event,
  lang,
  roomCode,
  t,
  onCancelEvent,
  onOpenEventModal,
  onOpenRoomCodeModal,
  onToggleCancelEvent,
}) {
  const formatEventDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <>
      {canEditRoom && (
        <div className="setting-row setting-row--event">
          {event.partyDate ? (
            <div className="event-set-info">
              <div className="event-set-details">
                <span className="event-set-date">{'\uD83D\uDCC5'} {formatEventDate(event.partyDate)}</span>
                {event.partyLocation && (
                  <a
                    className="event-set-location"
                    href={`https://www.google.com/maps/search/${encodeURIComponent(event.partyLocation)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {'\uD83D\uDCCD'} {event.partyLocation}
                  </a>
                )}
              </div>
              <div className="event-set-actions">
                <button className="btn-setting-action" onClick={onOpenEventModal}>{t('editEventBtn')}</button>
                {event.confirmCancel ? (
                  <span className="confirm-inline">
                    <span className="confirm-inline-label">{t('confirmQuestion')}</span>
                    <button className="btn-setting-action btn-setting-action--danger" onClick={onCancelEvent}>{t('confirmYes')}</button>
                    <button className="btn-setting-action" onClick={() => onToggleCancelEvent(false)}>{t('confirmNo')}</button>
                  </span>
                ) : (
                  <button className="btn-setting-action btn-setting-action--danger" onClick={() => onToggleCancelEvent(true)}>{t('cancelEventBtn')}</button>
                )}
              </div>
            </div>
          ) : (
            <button className="btn-setting-action" style={{ flex: 1 }} onClick={onOpenEventModal}>{t('setEventBtn')}</button>
          )}
        </div>
      )}

      {canEditRoom && (
        <div className="setting-row">
          <button className="btn-setting-action" style={{ flex: 1 }} onClick={onOpenRoomCodeModal}>
            {t('changeRoomCode')}
          </button>
          {roomCode && <span className="code-hint">{roomCode}</span>}
        </div>
      )}
    </>
  )
}
