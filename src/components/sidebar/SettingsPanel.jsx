import { useState } from 'react'
import { ContactMessageForm } from '../ContactMessageForm'
import { NotePicker } from '../NotePicker'
import { useLanguage } from '../../context/LanguageContext'

function SuggestionsSection({
  suggestions,
  showThumbnails,
  approveSuggestion,
  rejectSuggestion,
}) {
  const { t } = useLanguage()

  if (!suggestions?.length) return null

  return (
    <div className="section">
      <div className="section-title-row">
        <h2 className="section-title">{t('suggestionsHeader')} <span className="count">{suggestions.length}</span></h2>
      </div>
      <div className="suggestions-list">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="suggestion-item">
            {showThumbnails && <img src={`https://img.youtube.com/vi/${suggestion.ytId}/default.jpg`} alt="" className="song-thumb" />}
            <span className="song-title">{suggestion.title}</span>
            <div className="suggestion-actions">
              <button className="btn-icon play" onClick={() => approveSuggestion(suggestion)} title={t('addToList')}>OK</button>
              <button className="btn-icon danger" onClick={() => rejectSuggestion(suggestion.id)} title={t('reject')}>x</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SettingsPanel({
  room,
  suggestions,
  approveSuggestion,
  rejectSuggestion,
  showThumbnails,
  showAddedBy,
  voteThreshold,
  voteMode,
  skipThreshold,
  allowSuggestions,
  allowGuestListening,
  tickerText,
  tickerOnScreen,
  tickerForGuests,
  queueSize,
  saveSettings,
  exportPlaylist,
  importPlaylist,
  copyAdminLink,
  copied,
  roomType,
  onRenameRoom,
  showQr,
  showQueueOverlay,
  showRoomCode,
  onToggleQr,
  onToggleQueueOverlay,
  onToggleShowRoomCode,
  isVisible,
  canEditRoom,
  onSubmitMessage,
}) {
  const { t } = useLanguage()
  const [openGroup, setOpenGroup] = useState('voting')
  const toggleGroup = (key) => setOpenGroup((current) => current === key ? null : key)

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
      <SuggestionsSection
        suggestions={suggestions}
        showThumbnails={showThumbnails}
        approveSuggestion={approveSuggestion}
        rejectSuggestion={rejectSuggestion}
      />

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

          <div className="setting-row">
            <span className="setting-label">{t('guestSuggestions')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!allowSuggestions} onChange={(event) => saveSettings('allowSuggestions', event.target.checked)} disabled={!canEditRoom} />
              <span className="toggle-slider" />
            </label>
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
            <span className="setting-label">{t('showAddedBy')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!showAddedBy} onChange={(event) => saveSettings('showAddedBy', event.target.checked)} disabled={!canEditRoom} />
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
              <div className="settings-stat">
                <span className="settings-stat-value">{avgRating}</span>
                <span className="settings-stat-label">{t('ratingLabel')}{ratingCount > 0 ? ` (${ratingCount} ${t('votesCount')})` : ''}</span>
              </div>
              <div className="settings-stat">
                <span className="settings-stat-value">{room?.totalPlays ?? 0}</span>
                <span className="settings-stat-label">{t('playsLabel')}</span>
              </div>
              <div className="settings-stat">
                <span className="settings-stat-value">{room?.totalVotes ?? 0}</span>
                <span className="settings-stat-label">{t('votesLabel')}</span>
              </div>
            </div>
          </div>

          {canEditRoom && (
            <div className="setting-row">
              <button className="btn-setting-action" style={{ flex: 1 }} onClick={copyAdminLink}>
                {copied === 'admin' ? t('copiedLink') : roomType === 'public' ? t('copyRoomLink') : t('copyAdminLink')}
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
    </>
  )
}
