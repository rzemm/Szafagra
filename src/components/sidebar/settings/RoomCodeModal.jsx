import { useState } from 'react'

export function RoomCodeModal({
  onChangeRoomCode,
  t,
  onClose,
}) {
  const [newCode, setNewCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [codeSaving, setCodeSaving] = useState(false)

  const handleCodeInput = (event) => {
    const value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    setNewCode(value)
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
      onClose()
      return
    }
    if (result?.error === 'taken') {
      setCodeError(t('codeErrorTaken'))
      return
    }
    setCodeError(t('codeErrorGeneric'))
  }

  return (
    <div className="song-settings-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="song-settings-modal">
        <div className="song-settings-header">
          <h3 className="song-settings-title">{t('changeRoomCode')}</h3>
          <button className="song-settings-close" onClick={onClose}>&#x2715;</button>
        </div>
        <div className="song-settings-body">
          <span className="song-settings-label">{t('codeLabel')}</span>
          <input
            className="song-settings-input code-input-mono"
            type="text"
            autoFocus
            value={newCode}
            onChange={handleCodeInput}
            onKeyDown={(event) => event.key === 'Enter' && !codeSaving && newCode.length >= 4 && handleCodeSave()}
            placeholder={t('codePlaceholder')}
            maxLength={10}
          />
          {codeError && <span className="code-error-msg">{codeError}</span>}
          <span className="code-hint">{t('codeHint')}</span>
        </div>
        <div className="song-settings-footer" style={{ gap: '0.5rem' }}>
          <button className="btn-setting-action" onClick={onClose}>{t('cancel')}</button>
          <button className="song-settings-save" onClick={handleCodeSave} disabled={codeSaving || newCode.length < 4}>
            {codeSaving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
