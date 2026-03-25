export function UserPermissionsSettingsSection({ model, t }) {
  const {
    allowPlaybackStop,
    allowSuggestFromList,
    canEditRoom,
    playbackStopMinutes,
    playbackStopThreshold,
    saveSettings,
  } = model

  return (
    <>
      <div className="setting-row">
        <span className="setting-label">{t('permSuggestFromList')}</span>
        <select
          className="setting-select"
          value={allowSuggestFromList === true ? 'true' : allowSuggestFromList === 1 ? '1' : 'false'}
          onChange={(event) => {
            const value = event.target.value
            saveSettings('allowSuggestFromList', value === 'true' ? true : value === '1' ? 1 : false)
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
            checked={allowPlaybackStop}
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
    </>
  )
}
