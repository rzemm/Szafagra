import { useState } from 'react'

export function HomeCreateRoomModals({ isOpen, creatingRoom, t, onClose, onCreateParty }) {
  const [step, setStep] = useState(1)
  // Step 1
  const [partyName, setPartyName] = useState('')
  // Step 2 — mode
  const [selectedMode, setSelectedMode] = useState('party')
  // Step 2 — Impreza settings
  const [partyUnlimited, setPartyUnlimited] = useState(true)
  const [partySuggestionsLimit, setPartySuggestionsLimit] = useState(5)
  const [partyRequireLogin, setPartyRequireLogin] = useState(true)
  // Step 2 — Szafa grająca settings
  const [jukeboxAllowCollab, setJukeboxAllowCollab] = useState(false)
  const [jukeboxLimit, setJukeboxLimit] = useState(5)
  const [jukeboxRequireLogin, setJukeboxRequireLogin] = useState(true)
  // Step 3 — event
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventOpenParty, setEventOpenParty] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const combinedDateTime = eventDate
    ? (eventTime ? `${eventDate}T${eventTime}` : `${eventDate}T00:00`)
    : ''

  const handleClose = () => {
    setStep(1)
    setPartyName('')
    setSelectedMode('party')
    setEventDate('')
    setEventTime('')
    setEventLocation('')
    setEventDescription('')
    setEventOpenParty(false)
    onClose()
  }

  const buildExtraSettings = (withEvent) => {
    let settings = {}
    if (selectedMode === 'party') {
      settings = {
        allowSuggestions: true,
        requireSuggestionApproval: false,
        suggestionsPerUser: partyUnlimited ? null : partySuggestionsLimit,
        suggestionsRequireLogin: partyUnlimited ? true : partyRequireLogin,
      }
    } else if (selectedMode === 'jukebox' && jukeboxAllowCollab) {
      settings = {
        allowSuggestions: true,
        requireSuggestionApproval: true,
        suggestionsPerUser: jukeboxLimit,
        suggestionsRequireLogin: jukeboxRequireLogin,
      }
    } else {
      settings = { allowSuggestions: false }
    }
    if (withEvent && eventDate) {
      settings.partyDate = combinedDateTime
      settings.partyLocation = eventLocation
      settings.partyDescription = eventDescription
      settings.openParty = eventOpenParty
    }
    return settings
  }

  const handleSubmit = (withEvent) => {
    setIsSubmitting(true)
    onCreateParty({ name: partyName, extraSettings: buildExtraSettings(withEvent) })
  }

  if (!isOpen) return null

  // Loading overlay
  if (isSubmitting) {
    return (
      <div className="create-room-overlay">
        <div className="party-config-modal" style={{ alignItems: 'center', padding: '2rem 1.5rem', gap: '0.75rem' }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <span className="create-room-title">{t('creating')}</span>
        </div>
      </div>
    )
  }

  // Step 1 — Name
  if (step === 1) {
    return (
      <div className="create-room-overlay" onClick={handleClose}>
        <div className="party-config-modal" onClick={(e) => e.stopPropagation()}>
          <div className="create-room-header">
            <span className="create-room-title">{t('partyNameStepTitle')}</span>
            <button className="create-room-close" onClick={handleClose}>×</button>
          </div>
          <div className="party-config-body">
            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
              <span className="setting-label">{t('partyNameLabel')}</span>
              <input
                className="song-settings-input"
                type="text"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder={t('partyNamePlaceholder')}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter' && partyName.trim()) setStep(2) }}
              />
            </div>
          </div>
          <div className="party-config-footer">
            <button className="party-config-btn party-config-btn--back" onClick={handleClose}>
              {t('partyConfigBack')}
            </button>
            <button
              className="party-config-btn party-config-btn--create"
              onClick={() => setStep(2)}
              disabled={!partyName.trim()}
            >
              {t('partyConfigCreate')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2 — Mode + settings
  if (step === 2) {
    const modes = [
      { key: 'party', label: t('modeImpreza'), desc: t('modeImprezaDesc') },
      { key: 'jukebox', label: t('modeJukebox'), desc: t('modeJukeboxDesc') },
      { key: 'custom', label: t('modeCustom'), desc: t('modeCustomDesc') },
    ]
    const activeDesc = modes.find((m) => m.key === selectedMode)?.desc ?? ''

    return (
      <div className="create-room-overlay" onClick={() => setStep(1)}>
        <div className="party-config-modal" onClick={(e) => e.stopPropagation()}>
          <div className="create-room-header">
            <span className="create-room-title">{t('roomModeStepTitle')}</span>
            <button className="create-room-close" onClick={handleClose}>×</button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.25rem 0' }}>
            {modes.map(({ key, label }) => (
              <button
                key={key}
                className={`party-config-btn ${selectedMode === key ? 'party-config-btn--create' : 'party-config-btn--back'}`}
                style={{ padding: '0.5rem 0.25rem', fontSize: '0.85rem' }}
                onClick={() => setSelectedMode(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <p style={{ margin: '0.6rem 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5, textAlign: 'center' }}>
            {activeDesc}
          </p>

          <div className="party-config-body">
            {selectedMode === 'party' && (
              <>
                <div className="setting-row">
                  <span className="setting-label">{t('partyConfigUnlimited')}</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={partyUnlimited}
                      onChange={(e) => {
                        setPartyUnlimited(e.target.checked)
                        if (e.target.checked) setPartyRequireLogin(true)
                      }}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                {!partyUnlimited && (
                  <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
                    <span className="setting-label">{t('partyConfigMaxSuggestionsLabel')}</span>
                    <div className="party-config-slider-row">
                      <input
                        type="range" min={1} max={50} value={partySuggestionsLimit}
                        onChange={(e) => setPartySuggestionsLimit(Number(e.target.value))}
                        className="party-config-slider"
                      />
                      <span className="party-config-slider-val">{partySuggestionsLimit}</span>
                    </div>
                  </div>
                )}
                <div className="setting-row">
                  <span className="setting-label" style={partyUnlimited ? { color: 'var(--text-dim)' } : {}}>
                    {t('partyConfigRequireLogin')}
                  </span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={partyUnlimited ? true : partyRequireLogin}
                      disabled={partyUnlimited}
                      onChange={(e) => setPartyRequireLogin(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </>
            )}

            {selectedMode === 'jukebox' && (
              <>
                <div className="setting-row">
                  <span className="setting-label">{t('jukeboxCollabLabel')}</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={jukeboxAllowCollab}
                      onChange={(e) => setJukeboxAllowCollab(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
                {jukeboxAllowCollab && (
                  <>
                    <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
                      <span className="setting-label">{t('partyConfigMaxSuggestionsLabel')}</span>
                      <div className="party-config-slider-row">
                        <input
                          type="range" min={1} max={50} value={jukeboxLimit}
                          onChange={(e) => setJukeboxLimit(Number(e.target.value))}
                          className="party-config-slider"
                        />
                        <span className="party-config-slider-val">{jukeboxLimit}</span>
                      </div>
                    </div>
                    <div className="setting-row">
                      <span className="setting-label">{t('partyConfigRequireLogin')}</span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={jukeboxRequireLogin}
                          onChange={(e) => setJukeboxRequireLogin(e.target.checked)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </>
                )}
              </>
            )}

            {selectedMode !== 'custom' && (
              <p className="create-room-footnote" style={{ margin: '0.25rem 0 0' }}>{t('partyConfigFootnote')}</p>
            )}
          </div>

          <div className="party-config-footer">
            <button className="party-config-btn party-config-btn--back" onClick={() => setStep(1)}>
              {t('partyConfigBack')}
            </button>
            <button className="party-config-btn party-config-btn--create" onClick={() => setStep(3)}>
              {t('partyConfigCreate')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3 — Event
  return (
    <div className="create-room-overlay" onClick={() => setStep(2)}>
      <div className="party-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="create-room-header">
          <span className="create-room-title">{t('eventModalTitle')}</span>
          <button className="create-room-close" onClick={handleClose}>×</button>
        </div>

        <div className="party-config-body">
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
            <span className="setting-label">{t('eventDateLabel')}</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="song-settings-input"
                style={{ flex: 2 }}
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <input
                className="song-settings-input"
                style={{ flex: 1 }}
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>
          </div>
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
            <span className="setting-label">{t('eventLocationLabel')}</span>
            <input
              className="song-settings-input"
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder={t('partyLocationPlaceholder')}
            />
          </div>
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
            <span className="setting-label">{t('eventDescLabel')}</span>
            <textarea
              className="song-settings-input event-desc-textarea"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder={t('eventDescPlaceholder')}
              rows={3}
            />
          </div>
          <div className="setting-row" style={{ marginTop: '0.25rem' }}>
            <span className="setting-label">{t('eventPublicLabel')}</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={eventOpenParty}
                onChange={(e) => setEventOpenParty(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="party-config-footer">
          <button className="party-config-btn party-config-btn--back" onClick={() => setStep(2)}>
            {t('partyConfigBack')}
          </button>
          <button className="party-config-btn party-config-btn--back" onClick={() => handleSubmit(false)}>
            {t('eventModalSkip')}
          </button>
          <button
            className="party-config-btn party-config-btn--create"
            onClick={() => handleSubmit(true)}
            disabled={!eventDate}
          >
            {t('eventModalOk')}
          </button>
        </div>
      </div>
    </div>
  )
}
