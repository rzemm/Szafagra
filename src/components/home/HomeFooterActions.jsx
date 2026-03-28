import { ContactMessageForm } from '../ContactMessageForm'

export function HomeFooterActions({ onOpenCookieSettings, onSubmitMessage, onToggleLang, t }) {
  return (
    <footer className="homepage-footer">
      <ContactMessageForm
        triggerClassName="homepage-footer-btn"
        triggerLabel={'\u2709\uFE0F ' + t('writeMessage')}
        title={t('writeMessageToCreators')}
        submitLabel={t('send')}
        successMessage={t('thanksSaved')}
        panelClassName="homepage-contact-form"
        onSubmit={(payload) => onSubmitMessage?.({ ...payload, source: 'homepage' })}
      />
      <button className="homepage-footer-btn" onClick={onOpenCookieSettings}>{'\uD83C\uDF6A'} {t('cookieSettings')}</button>
      <a className="homepage-footer-btn" href="/privacy.html" target="_blank" rel="noreferrer">{'\uD83D\uDD12'} {t('privacy')}</a>
      <a className="homepage-footer-btn" href="/terms.html" target="_blank" rel="noreferrer">{'\uD83D\uDCC4'} {t('terms')}</a>
      <button className="homepage-footer-btn" onClick={onToggleLang}>{t('langToggle')}</button>
    </footer>
  )
}
