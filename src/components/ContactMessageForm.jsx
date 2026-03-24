import { useState } from 'react'
import { useLanguage } from '../context/useLanguage'

function initialFormState() {
  return {
    message: '',
    authorName: '',
    authorEmail: '',
  }
}

export function ContactMessageForm({
  onSubmit,
  title = '',
  description = '',
  triggerLabel = '',
  submitLabel = '',
  successMessage = '',
  triggerClassName = 'contact-form-trigger',
  panelClassName = '',
}) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState(initialFormState)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedMessage = form.message.trim()
    if (!trimmedMessage) {
      setError(t('enterMessageContent'))
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const ok = await onSubmit({
        message: trimmedMessage,
        authorName: form.authorName,
        authorEmail: form.authorEmail,
      })

      if (!ok) return

      setForm(initialFormState())
      setSuccess(successMessage || t('messageSaved'))
      setIsOpen(false)
    } catch (submitError) {
      setError(submitError?.message ?? t('failedToSend'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`contact-form${panelClassName ? ` ${panelClassName}` : ''}`}>
      <button
        className={triggerClassName}
        type="button"
        onClick={() => {
          setIsOpen((current) => !current)
          setError('')
          setSuccess('')
        }}
      >
        {triggerLabel || t('writeMessage')}
      </button>

      {isOpen && (
        <form className="contact-form-panel" onSubmit={handleSubmit}>
          <div className="contact-form-header">
            <h3 className="contact-form-title">{title || t('writeMessage')}</h3>
            {description && <p className="contact-form-description">{description}</p>}
          </div>

          <label className="contact-form-field">
            <span>{t('messageLabel')}</span>
            <textarea
              className="contact-form-textarea"
              rows="4"
              value={form.message}
              onChange={(event) => handleChange('message', event.target.value)}
              placeholder={t('messagePlaceholder')}
            />
          </label>

          <label className="contact-form-field">
            <span>{t('signatureLabel')}</span>
            <input
              type="text"
              value={form.authorName}
              onChange={(event) => handleChange('authorName', event.target.value)}
              placeholder={t('optional')}
            />
          </label>

          <label className="contact-form-field">
            <span>Email</span>
            <input
              type="email"
              value={form.authorEmail}
              onChange={(event) => handleChange('authorEmail', event.target.value)}
              placeholder={t('optional')}
            />
          </label>

          {error && <p className="contact-form-feedback contact-form-feedback--error">{error}</p>}
          {success && <p className="contact-form-feedback contact-form-feedback--success">{success}</p>}

          <div className="contact-form-actions">
            <button
              className="contact-form-cancel"
              type="button"
              onClick={() => {
                setIsOpen(false)
                setError('')
              }}
              disabled={isSubmitting}
            >
              {t('closeBtn')}
            </button>
            <button className="contact-form-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('sending') : (submitLabel || t('send'))}
            </button>
          </div>
        </form>
      )}

      {!isOpen && success && <p className="contact-form-feedback contact-form-feedback--success">{success}</p>}
    </div>
  )
}
