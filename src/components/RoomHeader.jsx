import { useState } from 'react'
import { ScrollText } from './ScrollText'
import { UserProfileModal } from './UserProfileModal'
import { useLanguage } from '../context/LanguageContext'

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

export function RoomHeader({
  showOwnerUI,
  canEditRoom,
  leftPanel,
  toggleLeftPanel,
  newSongUrl,
  setNewSongUrl,
  handleUrlBlur,
  addSong,
  newSongTitle,
  fetchingTitle,
  urlErr,
  room,
  user,
  signInWithGoogle,
  signOutUser,
  onShareGuestLink,
  guestCopied,
  suggestions,
  searchSuggestions = [],
  selectSuggestion,
  clearSuggestions,
  onOpenCookieSettings,
  updateDisplayName,
}) {
  const { t, toggleLang } = useLanguage()
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-inner">
        {showOwnerUI && (
          <>
            <button
              className={`btn-panel-toggle${leftPanel === 'songs' ? ' active' : ''}`}
              onClick={() => toggleLeftPanel('songs')}
              title={t('panelSongsTitle')}
            >
              {t('panelSongs')}
            </button>
            <button
              className={`btn-panel-toggle${leftPanel === 'queue' ? ' active' : ''}`}
              onClick={() => toggleLeftPanel('queue')}
              title={t('panelQueueTitle')}
            >
              {t('panelQueue')}
            </button>
            <button
              className={`btn-panel-toggle${leftPanel === 'settings' ? ' active' : ''}`}
              onClick={() => toggleLeftPanel('settings')}
              title={t('panelSettingsTitle')}
            >
              {t('panelSettings')}{suggestions?.length > 0 ? ` (${suggestions.length})` : ''}
            </button>
          </>
        )}
        <a href="/" className="header-logo">szafi.fi</a>
      </div>

      {showOwnerUI && canEditRoom && (
        <div className="header-add-song">
          <div className="song-input-wrapper">
            <input
              className="header-song-input"
              value={newSongUrl}
              onChange={(event) => setNewSongUrl(event.target.value)}
              onBlur={handleUrlBlur}
              onKeyDown={(event) => {
                if (event.key === 'Enter') addSong()
                if (event.key === 'Escape') clearSuggestions()
              }}
              placeholder={fetchingTitle ? t('fetchingTitlePlaceholder') : newSongTitle ? `${t('addSongTitlePrefix')} ${newSongTitle}` : t('addSongPlaceholder')}
              title={urlErr || undefined}
              style={urlErr ? { borderColor: 'var(--accent)' } : undefined}
              disabled={!room}
            />
            {searchSuggestions.length > 0 && (
              <ul className="song-suggestions-dropdown">
                {searchSuggestions.map((s) => (
                  <li
                    key={s.ytId}
                    className="song-suggestion-item"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(s)}
                  >
                    {s.thumbnail && <img src={s.thumbnail} className="suggestion-thumb" alt="" />}
                    <ScrollText className="suggestion-title">{s.title}</ScrollText>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="btn-header-add" onClick={addSong} disabled={!newSongUrl.trim() || !room}>+</button>
        </div>
      )}

      <div className="header-actions">
        <button className="header-utility-link" onClick={onOpenCookieSettings}>
          {t('cookies')}
        </button>

        <button className="lang-toggle" onClick={toggleLang}>{t('langToggle')}</button>

        {user?.isAnonymous ? (
          <button className="header-google-btn" onClick={signInWithGoogle} title={t('signInGoogle2')}>
            <GoogleIcon />
            <span>{t('signIn')}</span>
          </button>
        ) : user ? (
          <div className="header-google-user">
            <button
              className="header-avatar-btn"
              onClick={() => setProfileOpen(true)}
              title={t('accountSettings')}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="header-google-avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="header-avatar-initials">
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </span>
              )}
            </button>
            <button className="header-google-logout" onClick={signOutUser}>{t('signOut')}</button>
            {profileOpen && (
              <UserProfileModal
                user={user}
                onClose={() => setProfileOpen(false)}
                onUpdateDisplayName={updateDisplayName}
              />
            )}
          </div>
        ) : null}

        {showOwnerUI ? (
          <a className="btn-share" href="https://buycoffee.to/szafifi" target="_blank" rel="noreferrer">{t('buyCoffee')}</a>
        ) : (
          <button className="btn-header-share" onClick={onShareGuestLink} title={t('shareLink')}>
            {guestCopied ? 'OK' : 'Link'}
          </button>
        )}
      </div>
    </header>
  )
}
