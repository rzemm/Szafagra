import { useState } from 'react'
import { useLanguage } from '../context/useLanguage'
import { useYouTubeAuth } from '../hooks/useYouTubeAuth'
import { YouTubeAuthNotice } from './YouTubeAuthNotice'
import { YouTubeImportModal } from './YouTubeImportModal'

const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
  </svg>
)

const SpotifyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.28c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.54-1.26.24-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-.96-.12-1.08-.6-.12-.48.12-.96.6-1.08 4.38-1.32 9.78-.66 13.5 1.62.36.18.54.78.18 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/>
  </svg>
)

export function UserProfileModal({ user, onClose, onUpdateDisplayName, onCreateRoomFromYt, onAddYtToRoom, currentRoomId, ownedRooms }) {
  const { t } = useLanguage()
  const [name, setName] = useState(user?.displayName ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const yt = useYouTubeAuth()

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

  if (showImport && yt.accessToken) {
    return (
      <YouTubeImportModal
        accessToken={yt.accessToken}
        onClose={() => setShowImport(false)}
        onCreateRoom={async (name, songs) => {
          await onCreateRoomFromYt(name, songs)
          yt.disconnect()
        }}
        onAddToRoom={async (roomId, songs) => {
          await onAddYtToRoom(roomId, songs)
          yt.disconnect()
        }}
        currentRoomId={currentRoomId}
        ownedRooms={ownedRooms ?? []}
      />
    )
  }

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

          <div className="upmodal-integrations">
            <div className="upmodal-integrations-label">{t('integrations')}</div>

            <div className="upmodal-integration-row">
              <div className="upmodal-integration-icon upmodal-integration-icon--yt">
                <YouTubeIcon />
              </div>
              <div className="upmodal-integration-info">
                <div className="upmodal-integration-name">{t('connectYouTube')}</div>
                <div className="upmodal-integration-desc">{t('connectYouTubeDesc')}</div>
              </div>
              {yt.accessToken ? (
                <div className="upmodal-yt-connected-actions">
                  <button className="upmodal-yt-btn" onClick={() => setShowImport(true)}>
                    {t('ytImportOpen')}
                  </button>
                  <button
                    className="upmodal-yt-btn upmodal-yt-btn--disconnect"
                    onClick={() => { yt.disconnect(); yt.connect() }}
                  >
                    {t('ytSwitchAccount')}
                  </button>
                  <button className="upmodal-yt-btn upmodal-yt-btn--disconnect" onClick={yt.disconnect}>
                    {t('ytDisconnect')}
                  </button>
                </div>
              ) : (
                <button
                  className="upmodal-yt-btn"
                  onClick={yt.connect}
                  disabled={yt.connecting || !user || user.isAnonymous}
                >
                  {yt.connecting ? t('ytConnecting') : t('ytConnect')}
                </button>
              )}
            </div>
            {yt.error && <div className="upmodal-yt-error">{yt.error}</div>}
            <YouTubeAuthNotice helpText={yt.helpText} className="upmodal-yt-help" />

            <div className="upmodal-integration-row upmodal-integration--disabled">
              <div className="upmodal-integration-icon upmodal-integration-icon--sp">
                <SpotifyIcon />
              </div>
              <div className="upmodal-integration-info">
                <div className="upmodal-integration-name">{t('connectSpotify')}</div>
                <div className="upmodal-integration-desc">{t('connectSpotifyDesc')}</div>
              </div>
              <span className="upmodal-coming-soon">{t('comingSoon')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
