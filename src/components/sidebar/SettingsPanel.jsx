import { useRef, useState } from 'react'

import { ContactMessageForm } from '../ContactMessageForm'
import { NotePicker } from '../NotePicker'
import { HelpModal } from '../HelpPage'
import { CollaborativeModeSettings } from './CollaborativeModeSettings'
import { SettingHint } from './SettingHint'
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
  partyDate,
  partyLocation,
  partyDescription,
}) {
  const { t, lang } = useLanguage()
  const [openGroup, setOpenGroup] = useState('voting')
  const [helpSection, setHelpSection] = useState(null)
  const toggleGroup = (key) => setOpenGroup((current) => current === key ? null : key)
  const requireSuggestionApproval = room?.settings?.requireSuggestionApproval ?? true
  const allowPlaybackStop = room?.settings?.allowPlaybackStop ?? false
  const playbackStopThreshold = Math.max(1, room?.settings?.playbackStopThreshold ?? 2)
  const playbackStopMinutes = Math.max(1, room?.settings?.playbackStopMinutes ?? 5)
  const suggestionsPerUser = room?.settings?.suggestionsPerUser ?? null
  const suggestionsRequireLogin = room?.settings?.suggestionsRequireLogin ?? true

  const [showEventPopup, setShowEventPopup] = useState(false)
  const [confirmCancelEvent, setConfirmCancelEvent] = useState(false)
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
            {t('votingOptionsGroup')} <SettingHint onClick={() => setHelpSection('voting')} />
            <span className="settings-group-arrow">{openGroup === 'voting' ? '\u25be' : '\u25b8'}</span>
          </span>

          {openGroup === 'voting' && <>
          <div className="setting-row">
            <span className="setting-label">{t('voteType')}</span>
            <div className="setting-toggle-group">
              <button className={`btn-setting${voteMode === 'highest' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'highest')} disabled={!canEditRoom}>{t('voteModeHighest')}</button>
              <button className={`btn-setting${voteMode === 'weighted' ? ' active' : ''}`} onClick={() => saveSettings('voteMode', 'weighted')} disabled={!canEditRoom}>{t('voteModeWeighted')}</button>
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

          </>}
        </div>

        <div className="settings-group">
          <span className="settings-group-title settings-group-title--clickable" onClick={() => toggleGroup('room')}>
            {t('roomOptionsGroup')} <SettingHint onClick={() => setHelpSection('room')} />
            <span className="settings-group-arrow">{openGroup === 'room' ? '\u25be' : '\u25b8'}</span>
          </span>

          {openGroup === 'room' && (
            <CollaborativeModeSettings
              allowSuggestions={allowSuggestions}
              requireSuggestionApproval={requireSuggestionApproval}
              suggestionsPerUser={suggestionsPerUser}
              suggestionsRequireLogin={suggestionsRequireLogin}
              canEditRoom={canEditRoom}
              saveSettings={saveSettings}
              t={t}
            />
          )}
        </div>

        <div className="settings-group">
          <span className="settings-group-title settings-group-title--clickable" onClick={() => toggleGroup('userPermissions')}>
            {t('userPermissionsGroup')} <SettingHint onClick={() => setHelpSection('userPermissions')} />
            <span className="settings-group-arrow">{openGroup === 'userPermissions' ? '\u25be' : '\u25b8'}</span>
          </span>

          {openGroup === 'userPermissions' && <>
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
            <span className="setting-label">{t('allowPlaybackStop')}</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!allowPlaybackStop}
                onChange={(event) => saveSettings('allowPlaybackStop', event.target.checked)}
                disabled={!canEditRoom}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('playbackStopThreshold')}</span>
            <input
              className="setting-number-input"
              type="number"
              min="1"
              max="99"
              value={playbackStopThreshold}
              onChange={(event) => saveSettings('playbackStopThreshold', Math.max(1, parseInt(event.target.value, 10) || 1))}
              disabled={!canEditRoom || !allowPlaybackStop}
            />
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('playbackStopDuration')}</span>
            <input
              className="setting-number-input"
              type="number"
              min="1"
              max="240"
              value={playbackStopMinutes}
              onChange={(event) => saveSettings('playbackStopMinutes', Math.max(1, parseInt(event.target.value, 10) || 1))}
              disabled={!canEditRoom || !allowPlaybackStop}
            />
          </div>
          </>}
        </div>

        <div className="settings-group">
          <span className="settings-group-title settings-group-title--clickable" onClick={() => toggleGroup('display')}>
            {t('displayGroup')} <SettingHint onClick={() => setHelpSection('display')} />
            <span className="settings-group-arrow">{openGroup === 'display' ? '\u25be' : '\u25b8'}</span>
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
          <span className="settings-group-title settings-group-title--clickable" onClick={() => toggleGroup('event')}>
            {t('eventGroup')} <SettingHint onClick={() => setHelpSection('event')} />
            <span className="settings-group-arrow">{openGroup === 'event' ? '\u25be' : '\u25b8'}</span>
          </span>

          {openGroup === 'event' && <>
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
                    {confirmCancelEvent ? (
                      <span className="confirm-inline">
                        <span className="confirm-inline-label">{t('confirmQuestion')}</span>
                        <button className="btn-setting-action btn-setting-action--danger" onClick={() => { setConfirmCancelEvent(false); handleCancelEvent() }}>{t('confirmYes')}</button>
                        <button className="btn-setting-action" onClick={() => setConfirmCancelEvent(false)}>{t('confirmNo')}</button>
                      </span>
                    ) : (
                      <button className="btn-setting-action btn-setting-action--danger" onClick={() => setConfirmCancelEvent(true)}>{t('cancelEventBtn')}</button>
                    )}
                  </div>
                </div>
              ) : (
                <button className="btn-setting-action" style={{ flex: 1 }} onClick={openEventPopup}>{t('setEventBtn')}</button>
              )}
            </div>
          )}

          {canEditRoom && (
            <div className="setting-row">
              <button className="btn-setting-action" style={{ flex: 1 }} onClick={openCodePopup}>
                {t('changeRoomCode')}
              </button>
            </div>
          )}
          </>}
        </div>

        <div className="settings-group">
          <span className="settings-group-title settings-group-title--clickable" onClick={() => toggleGroup('roomInfo')}>
            {t('roomInfoGroup')} <SettingHint onClick={() => setHelpSection('roomInfo')} />
            <span className="settings-group-arrow">{openGroup === 'roomInfo' ? '\u25be' : '\u25b8'}</span>
          </span>

          {openGroup === 'roomInfo' && <>
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
                <span className="settings-stat-icon">{'★'}</span>
                <span className="settings-stat-value">{avgRating}</span>
                <span className="settings-stat-label">{t('ratingLabel')}{ratingCount > 0 ? ` (${ratingCount})` : ''}</span>
              </div>
              <div className="settings-stat settings-stat--plays">
                <span className="settings-stat-icon">{'▶'}</span>
                <span className="settings-stat-value">{room?.totalPlays ?? 0}</span>
                <span className="settings-stat-label">{t('playsLabel')}</span>
              </div>
              <div className="settings-stat settings-stat--votes">
                <span className="settings-stat-icon">{'✓'}</span>
                <span className="settings-stat-value">{room?.totalVotes ?? 0}</span>
                <span className="settings-stat-label">{t('votesLabel')}</span>
              </div>
            </div>
          </div>

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

      {helpSection && <HelpModal activeSection={helpSection} onClose={() => setHelpSection(null)} />}

      {showCodePopup && (
        <div className="song-settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCodePopup(false) }}>
          <div className="song-settings-modal">
            <div className="song-settings-header">
              <h3 className="song-settings-title">{t('changeRoomCode')}</h3>
              <button className="song-settings-close" onClick={() => setShowCodePopup(false)}>&#x2715;</button>
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
