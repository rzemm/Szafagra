const GoogleLogoSvg = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
)

export function HomeHeader({
  user,
  isLoggedIn,
  headerSlide,
  onSetHeaderSlide,
  onOpenAccountSettings,
  onSignIn,
  onSignOut,
  logoUrl,
  t,
}) {
  const slides = [
    { icon: '\uD83C\uDFAC', text: t('howStep1Desc') },
    { icon: '\u25B6\uFE0F', text: t('howStep2Desc') },
    { icon: '\uD83D\uDCF1', text: t('howStep3Desc') },
  ]

  return (
    <div className="homepage-top">
      <div className="homepage-logo">
        <img src={logoUrl} alt="szafi.fi" className="homepage-logo-img" />
      </div>
      <div className="homepage-header-carousel">
        <div className="homepage-header-dots">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              className={`homepage-header-dot${index === headerSlide ? ' active' : ''}`}
              onClick={() => onSetHeaderSlide(index)}
            >
              {'\u266A'}
            </button>
          ))}
        </div>
        <div className="homepage-header-carousel-wrap">
          {slides.map((slide, index) => (
            <div key={index} className={`homepage-header-slide${index === headerSlide ? ' active' : ''}`}>
              <span className={`homepage-header-slide-icon homepage-header-slide-icon--tone-${index + 1}`}>{slide.icon}</span>
              <span className="homepage-header-slide-text">{slide.text}</span>
            </div>
          ))}
        </div>
      </div>
      {isLoggedIn ? (
        <div className="home-user-bar">
          <button className="home-user-avatar-btn" onClick={onOpenAccountSettings} title={t('accountSettings')}>
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="home-user-avatar" referrerPolicy="no-referrer" />
              : <div className="home-user-avatar-initials">{(user.displayName || '?')[0].toUpperCase()}</div>
            }
            <span className="home-user-name">{user.displayName}</span>
          </button>
          <button className="home-user-logout" onClick={onSignOut}>
            <span className="home-logout-x">{'\u2715'}</span>
            {t('signOut')}
          </button>
        </div>
      ) : (
        <button className="home-google-btn" onClick={onSignIn}>
          <GoogleLogoSvg />
          {t('signInGoogle')}
        </button>
      )}
    </div>
  )
}
