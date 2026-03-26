import { ContactMessageForm } from '../../ContactMessageForm'

export function RoomInfoSection({ model, t }) {
  const {
    canEditRoom,
    exportPlaylist,
    importPlaylist,
    isVisible,
    onCopyRoomLink,
    onRenameRoom,
    onSubmitMessage,
    room,
    roomLinkCopied,
    saveSettings,
  } = model

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

      <div className="setting-row">
        <button className="btn-setting-action" style={{ flex: 1 }} onClick={onCopyRoomLink}>
          {roomLinkCopied ? t('copiedLink') : t('copyRoomLink')}
        </button>
      </div>

      <div className="setting-row setting-row--stats">
        <div className="settings-stats">
          <div className="settings-stat settings-stat--rating">
            <span className="settings-stat-icon">{'\u2605'}</span>
            <span className="settings-stat-value">{avgRating}</span>
            <span className="settings-stat-label">{t('ratingLabel')}{ratingCount > 0 ? ` (${ratingCount})` : ''}</span>
          </div>
          <div className="settings-stat settings-stat--plays">
            <span className="settings-stat-icon">{'\u25B6'}</span>
            <span className="settings-stat-value">{room?.totalPlays ?? 0}</span>
            <span className="settings-stat-label">{t('playsLabel')}</span>
          </div>
          <div className="settings-stat settings-stat--votes">
            <span className="settings-stat-icon">{'\u2714'}</span>
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
    </>
  )
}
