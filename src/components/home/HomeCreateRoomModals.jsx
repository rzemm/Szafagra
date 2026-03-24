export function HomeCreateRoomModals({
  creatingRoom,
  showCreateModal,
  showPartyConfig,
  partyUnlimited,
  partySuggestionsLimit,
  partyRequireLogin,
  t,
  onCloseCreateModal,
  onOpenPartyConfig,
  onCreateRoom,
  onBackToCreateModal,
  onClosePartyConfig,
  onTogglePartyUnlimited,
  onPartySuggestionsLimitChange,
  onPartyRequireLoginChange,
  onCreateParty,
}) {
  return (
    <>
      {showCreateModal && (
        <div className="create-room-overlay" onClick={onCloseCreateModal}>
          <div className="create-room-modal" onClick={(event) => event.stopPropagation()}>
            <div className="create-room-header">
              <span className="create-room-title">{t('createNewRoom')}</span>
              <button className="create-room-close" onClick={onCloseCreateModal}>×</button>
            </div>
            <div className="create-room-options">
              <button className="create-room-option" onClick={onOpenPartyConfig} disabled={creatingRoom}>
                <span className="create-room-option-icon">🎉</span>
                <div className="create-room-option-text">
                  <span className="create-room-option-name">{t('createPartyPrep')}</span>
                  <span className="create-room-option-desc">{t('createPartyPrepDesc')}</span>
                </div>
              </button>
              <button className="create-room-option" onClick={() => onCreateRoom('party')} disabled={creatingRoom}>
                <span className="create-room-option-icon">🎵</span>
                <div className="create-room-option-text">
                  <span className="create-room-option-name">{t('createParty')}</span>
                  <span className="create-room-option-desc">{t('createPartyDesc')}</span>
                </div>
              </button>
              <button className="create-room-option" onClick={() => onCreateRoom('player')} disabled={creatingRoom}>
                <span className="create-room-option-icon">▶</span>
                <div className="create-room-option-text">
                  <span className="create-room-option-name">{t('createPlayer')}</span>
                  <span className="create-room-option-desc">{t('createPlayerDesc')}</span>
                </div>
              </button>
            </div>
            <p className="create-room-footnote">{t('createRoomFootnote')}</p>
          </div>
        </div>
      )}

      {showPartyConfig && (
        <div className="create-room-overlay" onClick={onClosePartyConfig}>
          <div className="party-config-modal" onClick={(event) => event.stopPropagation()}>
            <div className="create-room-header">
              <span className="create-room-title">{t('partyConfigTitle')}</span>
              <button className="create-room-close" onClick={onBackToCreateModal}>×</button>
            </div>

            <div className="party-config-body">
              <div className="setting-row">
                <span className="setting-label">{t('partyConfigUnlimited')}</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={partyUnlimited}
                    onChange={(event) => onTogglePartyUnlimited(event.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {!partyUnlimited && (
                <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
                  <span className="setting-label">{t('partyConfigMaxSuggestionsLabel')}</span>
                  <div className="party-config-slider-row">
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={partySuggestionsLimit}
                      onChange={(event) => onPartySuggestionsLimitChange(Number(event.target.value))}
                      className="party-config-slider"
                    />
                    <span className="party-config-slider-val">{partySuggestionsLimit}</span>
                  </div>
                </div>
              )}

              <div className="setting-row">
                <span className="setting-label" style={partyUnlimited ? { color: 'var(--text-dim)' } : {}}>{t('partyConfigRequireLogin')}</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={partyUnlimited ? true : partyRequireLogin}
                    disabled={partyUnlimited}
                    onChange={(event) => onPartyRequireLoginChange(event.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>

            <div className="party-config-footer">
              <button className="party-config-btn party-config-btn--back" onClick={onBackToCreateModal}>
                {t('partyConfigBack')}
              </button>
              <button className="party-config-btn party-config-btn--create" onClick={onCreateParty} disabled={creatingRoom}>
                {creatingRoom ? t('creating') : t('partyConfigCreate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
