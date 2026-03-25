import { NotePicker } from '../../NotePicker'

export function VotingSettingsSection({ model, t }) {
  const {
    canEditRoom,
    queueSize,
    saveSettings,
    skipThreshold,
    voteMode,
    voteThreshold,
  } = model

  return (
    <>
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
    </>
  )
}
