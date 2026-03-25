export function CollaborativeModeSettings({ allowSuggestions, requireSuggestionApproval, suggestionsPerUser, suggestionsRequireLogin, canEditRoom, saveSettings, t }) {
  const unlimited = suggestionsPerUser === null

  const handleUnlimitedChange = (checked) => {
    if (checked) {
      saveSettings('suggestionsPerUser', null)
    } else {
      saveSettings('suggestionsPerUser', 5)
    }
  }

  return (
    <>
      <div className="setting-row">
        <span className="setting-label">{t('collaborativeModeLabel')}</span>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={!!allowSuggestions}
            onChange={(e) => saveSettings('allowSuggestions', e.target.checked)}
            disabled={!canEditRoom}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {allowSuggestions && (
        <>
          <div className="setting-row">
            <span className="setting-label">{t('newSongsDestLabel')}</span>
            <div className="setting-toggle-group">
              <button
                className={`btn-setting${!!requireSuggestionApproval ? ' active' : ''}`}
                onClick={() => saveSettings('requireSuggestionApproval', true)}
                disabled={!canEditRoom}
              >{t('newSongsDestQueue')}</button>
              <button
                className={`btn-setting${!requireSuggestionApproval ? ' active' : ''}`}
                onClick={() => saveSettings('requireSuggestionApproval', false)}
                disabled={!canEditRoom}
              >{t('newSongsDestList')}</button>
            </div>
          </div>

          <div className="setting-row">
            <span className="setting-label">{t('partyConfigUnlimited')}</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={unlimited}
                onChange={(e) => handleUnlimitedChange(e.target.checked)}
                disabled={!canEditRoom}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {!unlimited && (
            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
              <span className="setting-label">{t('partyConfigMaxSuggestionsLabel')}</span>
              <div className="party-config-slider-row">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={suggestionsPerUser ?? 5}
                  onChange={(e) => saveSettings('suggestionsPerUser', Number(e.target.value))}
                  disabled={!canEditRoom}
                  className="party-config-slider"
                />
                <span className="party-config-slider-val">{suggestionsPerUser ?? 5}</span>
              </div>
            </div>
          )}

          <div className="setting-row">
            <span className="setting-label">{t('partyConfigRequireLogin')}</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={unlimited ? true : !!suggestionsRequireLogin}
                onChange={(e) => saveSettings('suggestionsRequireLogin', e.target.checked)}
                disabled={!canEditRoom || unlimited}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </>
      )}
    </>
  )
}
