import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

function ConsentCategory({ title, description, detail, alwaysOn, checked, onChange }) {
  const { t } = useLanguage()
  return (
    <div className="cookie-category">
      <div className="cookie-category-copy">
        <div className="cookie-category-head">
          <h3>{title}</h3>
          <span className={`cookie-badge${alwaysOn ? ' cookie-badge--locked' : ''}`}>
            {alwaysOn ? t('alwaysActive') : checked ? t('active') : t('inactive')}
          </span>
        </div>
        <p>{description}</p>
        <span className="cookie-category-detail">{detail}</span>
      </div>

      <label className="toggle-switch" aria-label={title}>
        <input type="checkbox" checked={checked} onChange={onChange} disabled={alwaysOn} />
        <span className="toggle-slider" />
      </label>
    </div>
  )
}

function CookiePolicyContent({ onOpenSettings }) {
  const { t } = useLanguage()
  return (
    <div className="cookie-policy">
      <div className="cookie-policy-block">
        <h3>{t('cookiePolicy')}</h3>
        <p>{t('cookiePolicyText')}</p>
      </div>

      <div className="cookie-policy-grid">
        <article className="cookie-policy-card">
          <h4>{t('essential')}</h4>
          <p>{t('essentialDesc')}</p>
          <span>{t('essentialNote')}</span>
        </article>

        <article className="cookie-policy-card">
          <h4>{t('analytics')}</h4>
          <p>{t('analyticsDesc')}</p>
          <span>{t('analyticsNote')}</span>
        </article>
      </div>

      <div className="cookie-policy-block">
        <h4>{t('storageTime')}</h4>
        <p>{t('storageTimeDesc')}</p>
      </div>

      <div className="cookie-policy-block">
        <h4>{t('changeDecision')}</h4>
        <p>
          {t('changeDecisionText')} <button type="button" className="cookie-inline-link" onClick={onOpenSettings}>{t('changeDecisionLink')}</button>,{' '}
          {t('changeDecisionText2')}
        </p>
      </div>
    </div>
  )
}

export function CookieConsentBanner({ onAcceptAll, onRejectOptional, onOpenSettings }) {
  const { t } = useLanguage()
  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label={t('cookieBannerLabel')}>
      <div className="cookie-banner-glow" />
      <div className="cookie-banner-copy">
        <span className="cookie-kicker">Cookies</span>
        <h2>{t('cookieBannerTitle')}</h2>
        <p>{t('cookieBannerDesc')}</p>
      </div>

      <div className="cookie-banner-actions">
        <button className="cookie-btn cookie-btn--ghost" onClick={onRejectOptional}>{t('rejectOptional')}</button>
        <button className="cookie-btn cookie-btn--soft" onClick={onOpenSettings}>{t('cookieSettingsTitle')}</button>
        <button className="cookie-btn cookie-btn--primary" onClick={onAcceptAll}>{t('acceptAll')}</button>
      </div>
    </div>
  )
}

function CookieSettingsDialog({
  consentState,
  onClose,
  onAcceptAll,
  onRejectOptional,
  onSavePreferences,
  onOpenSettings,
}) {
  const { t } = useLanguage()
  const [analyticsEnabled, setAnalyticsEnabled] = useState(Boolean(consentState.analytics))

  return (
    <div className="cookie-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="cookie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cookie-modal-header">
          <div>
            <span className="cookie-kicker">{t('privacy')}</span>
            <h2 id="cookie-settings-title">{t('cookieSettingsTitle')}</h2>
          </div>
          <button type="button" className="cookie-close-btn" onClick={onClose} aria-label={t('closeCookieSettings')}>
            x
          </button>
        </div>

        <div className="cookie-modal-body">
          <p className="cookie-modal-intro">{t('cookieModalIntro')}</p>

          <div className="cookie-categories">
            <ConsentCategory
              title={t('essential')}
              description={t('necessaryDesc')}
              detail={t('necessaryDetail')}
              alwaysOn
              checked
              onChange={() => {}}
            />

            <ConsentCategory
              title={t('analytics')}
              description={t('analyticsModalDesc')}
              detail={t('analyticsModalDetail')}
              checked={analyticsEnabled}
              onChange={() => setAnalyticsEnabled((current) => !current)}
            />
          </div>

          <CookiePolicyContent onOpenSettings={onOpenSettings} />
        </div>

        <div className="cookie-modal-actions">
          <button className="cookie-btn cookie-btn--ghost" onClick={onRejectOptional}>{t('rejectOptional')}</button>
          <button className="cookie-btn cookie-btn--soft" onClick={() => onSavePreferences({ analytics: analyticsEnabled })}>
            {t('savePreferences')}
          </button>
          <button className="cookie-btn cookie-btn--primary" onClick={onAcceptAll}>{t('acceptAllFull')}</button>
        </div>
      </section>
    </div>
  )
}

export function CookieSettingsModal({ isOpen, ...props }) {
  if (!isOpen) return null
  return <CookieSettingsDialog {...props} />
}
