import { useState, useEffect } from 'react'
import { useLanguage } from '../context/useLanguage'
import { isUsernameAvailable } from '../services/jukeboxService'

export function UsernamePickerModal({ onConfirm }) {
  const { t } = useLanguage()
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('idle') // idle | checking | available | taken | invalid
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const trimmed = value.trim()
    if (trimmed.length === 0) { setStatus('idle'); return }
    if (trimmed.length < 2) { setStatus('invalid'); return }

    setStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(trimmed)
        setStatus(available ? 'available' : 'taken')
      } catch {
        setStatus('idle')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [value])

  const handleConfirm = async () => {
    if (status !== 'available' || saving) return
    setSaving(true)
    try {
      await onConfirm(value.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="username-picker-overlay">
      <div className="username-picker-modal">
        <h2 className="username-picker-title">{t('usernamePickerTitle')}</h2>
        <p className="username-picker-desc">{t('usernamePickerDesc')}</p>

        <div className="username-picker-field">
          <input
            className={`username-picker-input username-picker-input--${status}`}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            maxLength={24}
            placeholder={t('usernamePickerPlaceholder')}
            autoFocus
            spellCheck={false}
          />
          {status === 'checking' && (
            <span className="username-picker-badge username-picker-badge--checking">{t('usernamePickerChecking')}</span>
          )}
          {status === 'available' && (
            <span className="username-picker-badge username-picker-badge--ok">✓ {t('usernamePickerAvailable')}</span>
          )}
          {status === 'taken' && (
            <span className="username-picker-badge username-picker-badge--err">✗ {t('usernameTaken')}</span>
          )}
          {status === 'invalid' && (
            <span className="username-picker-badge username-picker-badge--err">{t('usernameInvalid')}</span>
          )}
        </div>

        <button
          className="username-picker-btn"
          onClick={handleConfirm}
          disabled={status !== 'available' || saving}
        >
          {saving ? t('saving') : t('usernameConfirm')}
        </button>
      </div>
    </div>
  )
}
