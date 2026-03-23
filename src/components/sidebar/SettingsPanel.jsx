import { useRef, useState } from 'react'

const IconYouTube = () => (
  <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="28" height="20" rx="4" fill="#FF0000"/>
    <path d="M11.5 6l6 4-6 4V6z" fill="#fff"/>
  </svg>
)

const IconSpotify = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="11" cy="11" r="11" fill="#1DB954"/>
    <path d="M15.5 14.5c-2.5-1.5-5.5-1.6-9-0.9-0.4 0.1-0.5-0.5-0.1-0.6 3.7-0.8 7-0.6 9.7 1 0.3 0.2 0.1 0.7-0.6 0.5zm1-2.5c-2.9-1.8-7.3-2.3-10.7-1.3-0.4 0.1-0.7-0.3-0.4-0.6 3.8-1.1 8.5-0.6 11.7 1.4 0.4 0.2 0.1 0.8-0.6 0.5zm0.1-2.6C13.2 7.5 8 7.4 5 8.3c-0.5 0.1-0.8-0.4-0.4-0.7 3.4-1 9-0.9 12.5 1.2 0.4 0.3 0.1 0.9-0.5 0.6z" fill="#fff"/>
  </svg>
)
import { ContactMessageForm } from '../ContactMessageForm'
import { NotePicker } from '../NotePicker'
import { YouTubeAuthNotice } from '../YouTubeAuthNotice'
import { YouTubeImportModal } from '../YouTubeImportModal'
import { useYouTubeAuth } from '../../hooks/useYouTubeAuth'
import { useLanguage } from '../../context/LanguageContext'

function PlaylistSuggestionItem({ suggestion, showThumbnails, approvePlaylistSuggestion, rejectSuggestion }) {
  const { t } = useLanguage()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="suggestion-playlist-item">
      <div className="suggestion-playlist-header">
        <div className="suggestion-playlist-meta">
          <span className="suggestion-playlist-name">{suggestion.playlistTitle}</span>
          <span className="suggestion-playlist-info">
            {t('playlistSuggestionFrom')} · {t('playlistSuggestionSongs', suggestion.songs?.length ?? 0)}
          </span>
        </div>
        <div className="suggestion-actions">
          <button
            className="btn-icon"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? t('hidePlaylistSongs') : t('showPlaylistSongs')}
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button className="btn-icon play" onClick={() => approvePlaylistSuggestion(suggestion)} title={t('approveAllSongs')}>OK</button>
          <button className="btn-icon danger" onClick={() => rejectSuggestion(suggestion.id)} title={t('reject')}>x</button>
        </div>
      </div>
      {expanded && suggestion.songs?.length > 0 && (
        <ul className="suggestion-playlist-songs">
          {suggestion.songs.map((song, i) => (
            <li key={song.ytId || i} className="suggestion-playlist-song">
              {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />}
              <span className="song-title">{song.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SuggestionsSection({
  suggestions,
  showThumbnails,
  approveSuggestion,
  approvePlaylistSuggestion,
  rejectSuggestion,
}) {
  const { t } = useLanguage()

  if (!suggestions?.length) return null

  const songSuggestions = suggestions.filter((s) => s.type !== 'playlist')
  const playlistSuggestions = suggestions.filter((s) => s.type === 'playlist')

  return (
    <div className="section">
      <div className="section-title-row">
        <h2 className="section-title">{t('suggestionsHeader')} <span className="count">{suggestions.length}</span></h2>
      </div>
      {playlistSuggestions.map((suggestion) => (
        <PlaylistSuggestionItem
          key={suggestion.id}
          suggestion={suggestion}
          showThumbnails={showThumbnails}
          approvePlaylistSuggestion={approvePlaylistSuggestion}
          rejectSuggestion={rejectSuggestion}
        />
      ))}
      {songSuggestions.length > 0 && (
        <div className="suggestions-list">
          {songSuggestions.map((suggestion) => (
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
      )}
    </div>
  )
}

export function SettingsPanel({
  room,
  suggestions,
  approveSuggestion,
  approvePlaylistSuggestion,
  rejectSuggestion,
  showThumbnails,
  showAddedBy,
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
  copyAdminLink,
  copied,
  roomType,
  onRenameRoom,
  onChangeRoomCode,
  onCreateRoomFromYt,
  onAddYtToRoom,
  ownedRooms,
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
  const yt = useYouTubeAuth()
  const [openGroup, setOpenGroup] = useState('voting')
  const toggleGroup = (key) => setOpenGroup((current) => current === key ? null : key)
  const [showYtImport, setShowYtImport] = useState(false)

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
      <SuggestionsSection
        suggestions={suggestions}
        showThumbnails={showThumbnails}
        approveSuggestion={approveSuggestion}
        approvePlaylistSuggestion={approvePlaylistSuggestion}
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
            <span className="setting-label">{t('guestSuggestFromList')}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={!!allowSuggestFromList} onChange={(event) => saveSettings('allowSuggestFromList', event.target.checked)} disabled={!canEditRoom} />
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

          <div className="setting-row setting-row--service-icon">
            <IconYouTube />
            {yt.accessToken ? (
              <div className="service-btns-inline">
                <button className="btn-setting-action" onClick={() => setShowYtImport(true)}>{t('ytImportOpen')}</button>
                <button className="btn-setting-action" onClick={() => { yt.disconnect(); yt.connect() }}>{t('ytSwitchAccount')}</button>
                <button className="btn-setting-action btn-setting-action--dim" onClick={yt.disconnect}>{t('ytDisconnect')}</button>
              </div>
            ) : (
              <button className="btn-setting-action" style={{ flex: 1 }} onClick={yt.connect} disabled={yt.connecting}>
                {yt.connecting ? t('ytConnecting') : t('ytConnect')}
              </button>
            )}
            {yt.error && <span className="code-error-msg">{yt.error}</span>}
            <YouTubeAuthNotice helpText={yt.helpText} className="code-hint yt-auth-inline-help" />
          </div>

          <div className="setting-row setting-row--service-disabled">
            <IconSpotify />
            <span className="service-soon">{t('comingSoon')}</span>
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

      {showYtImport && yt.accessToken && (
        <YouTubeImportModal
          accessToken={yt.accessToken}
          onClose={() => setShowYtImport(false)}
          onCreateRoom={async (name, songs) => {
            await onCreateRoomFromYt(name, songs)
            yt.disconnect()
            setShowYtImport(false)
          }}
          onAddToRoom={async (roomId, songs) => {
            await onAddYtToRoom(roomId, songs)
            yt.disconnect()
            setShowYtImport(false)
          }}
          currentRoomId={room?.id ?? null}
          ownedRooms={ownedRooms ?? []}
        />
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
