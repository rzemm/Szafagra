import { useState } from 'react'
import { useLanguage } from '../context/useLanguage'

export function UserProfileModal({ user, onClose, onUpdateDisplayName, onSignOut }) {
  const { t } = useLanguage()
  const [name, setName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === user?.displayName) return
    setSaving(true)
    await onUpdateDisplayName(trimmed)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = (user?.displayName || user?.email || '?')[0].toUpperCase()

  return (
    <div className="upmodal-overlay" role="presentation" onClick={onClose}>
      <div
        className="upmodal"
        role="dialog"
        aria-modal="true"
        aria-label={t('accountSettings')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="upmodal-header">
          <div className="upmodal-user-row">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="upmodal-avatar" referrerPolicy="no-referrer" />
            ) : (
              <div className="upmodal-avatar upmodal-avatar--initials">{initials}</div>
            )}
            <div className="upmodal-user-info">
              <div className="upmodal-title">{t('accountSettings')}</div>
              {user?.email && <div className="upmodal-email">{user.email}</div>}
            </div>
          </div>
          <button className="upmodal-close" onClick={onClose} aria-label={t('closeModal')}>✕</button>
        </div>

        <div className="upmodal-body">
          <div className="upmodal-section">
            <label className="upmodal-label">{t('displayName')}</label>
            <div className="upmodal-input-row">
              <input
                className="upmodal-input"
                value={name}
                onChange={(e) => { setName(e.target.value); setSaved(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder={t('displayNamePlaceholder')}
              />
              <button
                className="upmodal-save-btn"
                onClick={handleSave}
                disabled={saving || !name.trim() || name.trim() === user?.displayName}
              >
                {saved ? t('saved') : saving ? t('saving') : t('save')}
              </button>
            </div>
          </div>

        </div>

        {onSignOut && (
          <div className="upmodal-section upmodal-section--footer">
            <button className="upmodal-signout-btn" onClick={onSignOut}>
              {t('signOut')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
