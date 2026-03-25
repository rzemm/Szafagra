import { useState } from 'react'

export function EventSettingsModal({
  lang,
  initialEvent,
  saveSettings,
  t,
  onClose,
}) {
  const [eventDate, setEventDate] = useState(initialEvent.partyDate ?? '')
  const [eventLocation, setEventLocation] = useState(initialEvent.partyLocation ?? '')
  const [eventDescription, setEventDescription] = useState(initialEvent.partyDescription ?? '')
  const [eventSaving, setEventSaving] = useState(false)

  const handleSave = async () => {
    if (!eventDate) return
    setEventSaving(true)
    await saveSettings('openParty', true)
    await saveSettings('partyDate', eventDate)
    await saveSettings('partyLocation', eventLocation)
    await saveSettings('partyDescription', eventDescription)
    setEventSaving(false)
    onClose()
  }

  const formattedDate = initialEvent.partyDate
    ? new Date(initialEvent.partyDate).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })
    : ''

  return (
    <div className="song-settings-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="song-settings-modal">
        <div className="song-settings-header">
          <h3 className="song-settings-title">{t('setEventTitle')}</h3>
          <button className="song-settings-close" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="song-settings-body">
          {formattedDate && <span className="song-settings-label">{formattedDate}</span>}
          <span className="song-settings-label">{t('eventDateLabel')}</span>
          <input
            className="song-settings-input"
            type="datetime-local"
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
          />
          <span className="song-settings-label" style={{ marginTop: '0.75rem' }}>{t('eventLocationLabel')}</span>
          <div className="event-location-row">
            <input
              className="song-settings-input"
              type="text"
              value={eventLocation}
              onChange={(event) => setEventLocation(event.target.value)}
              placeholder={t('partyLocationPlaceholder')}
            />
            {eventLocation && (
              <a
                className="event-maps-link"
                href={`https://www.google.com/maps/search/${encodeURIComponent(eventLocation)}`}
                target="_blank"
                rel="noreferrer"
                title={t('openInMaps')}
              >
                {'\uD83D\uDCCD'}
              </a>
            )}
          </div>
          <span className="song-settings-label" style={{ marginTop: '0.75rem' }}>{t('eventDescLabel')}</span>
          <textarea
            className="song-settings-input event-desc-textarea"
            value={eventDescription}
            onChange={(event) => setEventDescription(event.target.value)}
            placeholder={t('eventDescPlaceholder')}
            rows={3}
          />
        </div>
        <div className="song-settings-footer" style={{ gap: '0.5rem' }}>
          <button className="btn-setting-action" onClick={onClose}>{t('cancel')}</button>
          <button className="song-settings-save" onClick={handleSave} disabled={eventSaving || !eventDate}>
            {eventSaving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
