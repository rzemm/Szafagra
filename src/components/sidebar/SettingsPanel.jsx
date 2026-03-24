import { useRef, useState } from 'react'

import { ContactMessageForm } from '../ContactMessageForm'
import { NotePicker } from '../NotePicker'
import { useLanguage } from '../../context/useLanguage'

export function SettingsPanel({
  room,
  showThumbnails,
  voteThreshold,
  voteMode,
  skipThreshold,
  allowSuggestions,
  allowSuggestFromList,
  allowGuestListening,
  tickerText,
  tickerOnScreen,
  tickerForGuests,
  queueSize,
  saveSettings,
  exportPlaylist,
  importPlaylist,
  onRenameRoom,
  onChangeRoomCode,
  showQr,
  showQueueOverlay,
  showRoomCode,
  onToggleQr,
  onToggleQueueOverlay,
  onToggleShowRoomCode,
  isVisible,
  canEditRoom,
  onSubmitMessage,
  roomMode,
  partyDate,
  partyLocation,
  partyDescription,
}) {
  const { t, lang } = useLanguage()
  const [openGroup, setOpenGroup] = useState('voting')
  const toggleGroup = (key) => setOpenGroup((current) => current === key ? null : key)

  const [showEventPopup, setShowEventPopup] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventSaving, setEventSaving] = useState(false)

  const openEventPopup = () => {
    setEventDate(partyDate ?? '')
    setEventLocation(partyLocation ?? '')
    setEventDescription(partyDescription ?? '')
    setShowEventPopup(true)
  }

  const handleEventSave = async () => {
    if (!eventDate) return
    setEventSaving(true)
    await saveSettings('openParty', true)
    await saveSettings('partyDate', eventDate)
    await saveSettings('partyLocation', eventLocation)
    await saveSettings('partyDescription', eventDescription)
    setEventSaving(false)
    setShowEventPopup(false)
  }

  const handleCancelEvent = async () => {
    await saveSettings('openParty', false)
    await saveSettings('partyDate', '')
    await saveSettings('partyLocation', '')
    await saveSettings('partyDescription', '')
  }

  const formatEventDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })
  }

  const [showCodePopup, setShowCodePopup] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeSaving, setCodeSaving] = useState(false)
  const codeInputRef = useRef(null)

  const openCodePopup = () => {
    setNewCode('')
    setCodeError('')
    setShowCodePopup(true)
    setTimeout(() => codeInputRef.current?.focus(), 50)
  }

  const handleCodeInput = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    setNewCode(val)
    setCodeError('')
  }

  const handleCodeSave = async () => {
    if (newCode.length < 4) {
      setCodeError(t('codeErrorLength'))
      return
    }
    setCodeSaving(true)
    const result = await onChangeRoomCode(newCode)
    setCodeSaving(false)
    if (result?.success) {
      setShowCodePopup(false)
    } else if (result?.error === 'taken') {
      setCodeError(t('codeErrorTaken'))
    } else {
      setCodeError(t('codeErrorGeneric'))
    }
  }

  const handleImportChange = async (event) => {
    const [file] = event.target.files ?? []
    if (file) await importPlaylist(file)
    event.target.value = ''
  }

  const handleRoomNameSave = (value) => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== room?.name) onRenameRoom(trimmed)
  }

  const ratingsMap = room?.ratings ?? {}
  const ratingValues = Object.values(ratingsMap)
  const ratingCount = ratingValues.length
  const avgRating = ratingCount > 0
    ? (ratingValues.reduce((sum, value) => sum + value, 0) / ratingCount).toFixed(1)
    : '-'

  return (
    <>
      <div className="section sidebar-settings-list">
        <div className="settings-group">
          <span className="settings-group-title settings-group-title--clickable" onClick={() => toggleGroup('voting')}>
            {t('votingOptionsGroup')}
            <span className="settings-group-arrow">{openGroup === 'voting' ? '▾' : '▸'}</span>
          </span>

          {openGroup === 'voting' && <>
          <div className="setting-row">
            <span className="setting-label">{t('voteType')}</span>
            <div className="setting-toggle-group">
              <button className={`btn-setting${voteMode === 'highest' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'highest')} disabled={!canEditRoom}>Top</button>
              <button className={`btn-setting${voteMode === 'weighted' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'weighted')} disabled={!canEditRoom}>%</button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('songsPerGroup')}</span>
            <NotePicker value={queueSize} onChange={(value) => canEditRoom && saveSettings('queueSize', value)} />
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('minQueuedLabel')}</span>
            <div className="note-picker note-picker-sm">
              {[0, 1, 2, 3, 4].map((count) => (
                <button key={count} className={`note-btn${voteThreshold === count ? ' active' : ''}`} onClick={() => saveSettings('voteThreshold', count)} disabled={!canEditRoom}>
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('skipVotesRequired')}</span>
            <input
              className="setting-number-input"
              type="number"
              min="0"
              max="99"
              value={skipThreshold}
              onChange={(event) => saveSettings('skipThreshold', Math.max(0, parseInt(event.target.value, 10) || 0))}
              disabled={!canEditRoom}
            />
          </div>

          <div className="setting-row setting-row--perms-header">
            <span className="setting-label setting-label--sub">{t('permissionsHeader')}</span>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('permAddSongs')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!allowSuggestions} onChange={(event) => saveSettings('allowSuggestions', event.target.checked)} disabled={!canEditRoom} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('permSuggestFromList')}</span>
            <select
              className="setting-select"
              value={allowSuggestFromList === true ? 'true' : allowSuggestFromList === 1 ? '1' : 'false'}
              onChange={(event) => {
                const v = event.target.value
                saveSettings('allowSuggestFromList', v === 'true' ? true : v === '1' ? 1 : false)
              }}
              disabled={!canEditRoom}
            >
              <option value="false">{t('permSuggestFromListOff')}</option>
              <option value="1">{t('permSuggestFromListOne')}</option>
              <option value="true">{t('permSuggestFromListAny')}</option>
            </select>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('guestListening')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!allowGuestListening} onChange={(event) => saveSettings('allowGuestListening', event.target.checked)} disabled={!canEditRoom} />
              <span className="toggle-slider" />
            </label>
          </div>
          </>}
        </div>

        <div className="settings-group">
          <span className="settings-group-title settings-group-title--clickable" onClick={() => toggleGroup('display')}>
            {t('displayGroup')}
            <span className="settings-group-arrow">{openGroup === 'display' ? '▾' : '▸'}</span>
          </span>

          {openGroup === 'display' && <>
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
            <span className="setting-label">{t('textTicker')}</span>
            <input
              className="setting-ticker-input"
              type="text"
              placeholder={t('tickerPlaceholder')}
              value={tickerText}
              onChange={(event) => saveSettings('tickerText', event.target.value)}
              disabled={!canEditRoom}
            />
            <div className="setting-toggle-group">
              <button className={`btn-setting${tickerOnScreen ? ' active' : ''}`} onClick={() => saveSettings('tickerOnScreen', !tickerOnScreen)} disabled={!canEditRoom}>{t('onScreen')}</button>
              <button className={`btn-setting${tickerForGuests ? ' active' : ''}`} onClick={() => saveSettings('tickerForGuests', !tickerForGuests)} disabled={!canEditRoom}>{t('forGuests')}</button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('thumbnails')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!showThumbnails} onChange={(event) => saveSettings('showThumbnails', event.target.checked)} disabled={!canEditRoom} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('showQrCode')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!showQr} onChange={onToggleQr} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('showRoomCode')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!showRoomCode} onChange={onToggleShowRoomCode} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('showQueueOverlay')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!showQueueOverlay} onChange={onToggleQueueOverlay} />
              <span className="toggle-slider" />
            </label>
          </div>
          </>}
        </div>

        <div className="settings-group">
          <span className="settings-group-title settings-group-title--clickable" onClick={() => toggleGroup('room')}>
            {t('roomOptionsGroup')}
            <span className="settings-group-arrow">{openGroup === 'room' ? '▾' : '▸'}</span>
          </span>

          {openGroup === 'room' && <>
          <div className="setting-row">
            <span className="setting-label">{t('roomModeLabel')}</span>
            <div className="setting-toggle-group">
              <button className={`btn-setting${roomMode === 'party_prep' ? ' active' : ''}`} onClick={() => saveSettings('roomMode', 'party_prep')} disabled={!canEditRoom}>{t('modePartyPrep')}</button>
              <button className={`btn-setting${roomMode === 'party' ? ' active' : ''}`} onClick={() => saveSettings('roomMode', 'party')} disabled={!canEditRoom}>{t('modeParty')}</button>
              <button className={`btn-setting${roomMode === 'player' ? ' active' : ''}`} onClick={() => saveSettings('roomMode', 'player')} disabled={!canEditRoom}>{t('modePlayer')}</button>
            </div>
          </div>

          {canEditRoom && (
            <div className="setting-row setting-row--event">
              {partyDate ? (
                <div className="event-set-info">
                  <div className="event-set-details">
                    <span className="event-set-date">{'\uD83D\uDCC5'} {formatEventDate(partyDate)}</span>
                    {partyLocation && (
                      <a
                        className="event-set-location"
                        href={`https://www.google.com/maps/search/${encodeURIComponent(partyLocation)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {'\uD83D\uDCCD'} {partyLocation}
                      </a>
                    )}
                  </div>
                  <div className="event-set-actions">
                    <button className="btn-setting-action" onClick={openEventPopup}>{t('editEventBtn')}</button>
                    <button className="btn-setting-action btn-setting-action--danger" onClick={handleCancelEvent}>{t('cancelEventBtn')}</button>
                  </div>
                </div>
              ) : (
                <button className="btn-setting-action" style={{ flex: 1 }} onClick={openEventPopup}>{t('setEventBtn')}</button>
              )}
            </div>
          )}

          <div className="setting-row">
            <span className="setting-label">{t('nameSetting')}</span>
            <input
              className="setting-rename-input"
              key={room?.id ?? 'room-name'}
              defaultValue={room?.name ?? ''}
              onBlur={(event) => handleRoomNameSave(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && event.target.blur()}
              placeholder={t('roomNamePlaceholder')}
              disabled={!canEditRoom}
            />
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('roomVisibility')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={isVisible !== false} onChange={(event) => saveSettings('isVisible', event.target.checked)} disabled={!canEditRoom} />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row setting-row--stats">
            <div className="settings-stats">
              <div className="settings-stat settings-stat--rating">
                <span className="settings-stat-icon">★</span>
                <span className="settings-stat-value">{avgRating}</span>
                <span className="settings-stat-label">{t('ratingLabel')}{ratingCount > 0 ? ` (${ratingCount})` : ''}</span>
              </div>
              <div className="settings-stat settings-stat--plays">
                <span className="settings-stat-icon">▶</span>
                <span className="settings-stat-value">{room?.totalPlays ?? 0}</span>
                <span className="settings-stat-label">{t('playsLabel')}</span>
              </div>
              <div className="settings-stat settings-stat--votes">
                <span className="settings-stat-icon">✔</span>
                <span className="settings-stat-value">{room?.totalVotes ?? 0}</span>
                <span className="settings-stat-label">{t('votesLabel')}</span>
              </div>
            </div>
          </div>

          {canEditRoom && (
            <div className="setting-row">
              <button className="btn-setting-action" style={{ flex: 1 }} onClick={openCodePopup}>
                {t('changeRoomCode')}
              </button>
            </div>
          )}

          <div className="setting-row setting-row--import-export">
            <button className="btn-setting-action" style={{ flex: 1 }} onClick={exportPlaylist}>{t('exportBtn')}</button>
            {canEditRoom && (
              <label className="btn-setting-action btn-file" style={{ flex: 1 }}>
                {t('importBtn')}
                <input type="file" accept="application/json,.json" onChange={handleImportChange} />
              </label>
            )}
          </div>

          <div className="setting-row setting-row--message">
            <ContactMessageForm
              triggerClassName="btn-setting-action"
              triggerLabel={t('writeMessageSidebar')}
              title={t('writeMessageAboutRoom')}
              description={t('noteOrBugOrIdea')}
              successMessage={t('messageSaved')}
              submitLabel={t('sendMessage')}
              panelClassName="settings-contact-form"
              onSubmit={(payload) => onSubmitMessage({ ...payload, source: 'guest_room', roomId: room?.id ?? null })}
            />
          </div>
          </>}
        </div>
      </div>

      {showEventPopup && (
        <div className="song-settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEventPopup(false) }}>
          <div className="song-settings-modal">
            <div className="song-settings-header">
              <h3 className="song-settings-title">{t('setEventTitle')}</h3>
              <button className="song-settings-close" onClick={() => setShowEventPopup(false)}>&#x2715;</button>
            </div>
            <div className="song-settings-body">
              <span className="song-settings-label">{t('eventDateLabel')}</span>
              <input
                className="song-settings-input"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <span className="song-settings-label" style={{ marginTop: '0.75rem' }}>{t('eventLocationLabel')}</span>
              <div className="event-location-row">
                <input
                  className="song-settings-input"
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
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
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder={t('eventDescPlaceholder')}
                rows={3}
              />
            </div>
            <div className="song-settings-footer" style={{ gap: '0.5rem' }}>
              <button className="btn-setting-action" onClick={() => setShowEventPopup(false)}>{t('cancel')}</button>
              <button className="song-settings-save" onClick={handleEventSave} disabled={eventSaving || !eventDate}>
                {eventSaving ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCodePopup && (
        <div className="song-settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCodePopup(false) }}>
          <div className="song-settings-modal">
            <div className="song-settings-header">
              <h3 className="song-settings-title">{t('changeRoomCode')}</h3>
              <button className="song-settings-close" onClick={() => setShowCodePopup(false)}>✕</button>
            </div>
            <div className="song-settings-body">
              <span className="song-settings-label">{t('codeLabel')}</span>
              <input
                ref={codeInputRef}
                className="song-settings-input code-input-mono"
                type="text"
                value={newCode}
                onChange={handleCodeInput}
                onKeyDown={(e) => e.key === 'Enter' && !codeSaving && newCode.length >= 4 && handleCodeSave()}
                placeholder={t('codePlaceholder')}
                maxLength={10}
              />
              {codeError && <span className="code-error-msg">{codeError}</span>}
              <span className="code-hint">{t('codeHint')}</span>
            </div>
            <div className="song-settings-footer" style={{ gap: '0.5rem' }}>
              <button className="btn-setting-action" onClick={() => setShowCodePopup(false)}>{t('cancel')}</button>
              <button className="song-settings-save" onClick={handleCodeSave} disabled={codeSaving || newCode.length < 4}>
                {codeSaving ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
