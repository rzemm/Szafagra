export function DisplaySettingsSection({ model, t }) {
  const {
    canEditRoom,
    onToggleQr,
    onToggleQueueOverlay,
    onToggleShowRoomCode,
    saveSettings,
    showQr,
    showQueueOverlay,
    showRoomCode,
    showThumbnails,
    tickerForGuests,
    tickerOnScreen,
    tickerText,
  } = model

  return (
    <>
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
          <input type="checkbox" checked={showThumbnails} onChange={(event) => saveSettings('showThumbnails', event.target.checked)} disabled={!canEditRoom} />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="setting-row">
        <span className="setting-label">{t('showQrCode')}</span>
        <label className="toggle-switch">
          <input type="checkbox" checked={showQr} onChange={onToggleQr} />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="setting-row">
        <span className="setting-label">{t('showRoomCode')}</span>
        <label className="toggle-switch">
          <input type="checkbox" checked={showRoomCode} onChange={onToggleShowRoomCode} />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="setting-row">
        <span className="setting-label">{t('showQueueOverlay')}</span>
        <label className="toggle-switch">
          <input type="checkbox" checked={showQueueOverlay} onChange={onToggleQueueOverlay} />
          <span className="toggle-slider" />
        </label>
      </div>
    </>
  )
}
