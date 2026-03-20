import { useState } from 'react'

function initialFormState() {
  return {
    message: '',
    authorName: '',
    authorEmail: '',
  }
}

export function ContactMessageForm({
  onSubmit,
  title = 'Napisz wiadomosc',
  description = '',
  triggerLabel = 'Napisz wiadomosc',
  submitLabel = 'Wyslij',
  successMessage = 'Wiadomosc zostala wyslana.',
  triggerClassName = 'contact-form-trigger',
  panelClassName = '',
}) {
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
      setError('Wpisz tresc wiadomosci.')
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
      setSuccess(successMessage)
      setIsOpen(false)
    } catch (submitError) {
      setError(submitError?.message ?? 'Nie udalo sie wyslac wiadomosci.')
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
        {triggerLabel}
      </button>

      {isOpen && (
        <form className="contact-form-panel" onSubmit={handleSubmit}>
          <div className="contact-form-header">
            <h3 className="contact-form-title">{title}</h3>
            {description && <p className="contact-form-description">{description}</p>}
          </div>

          <label className="contact-form-field">
            <span>Wiadomosc</span>
            <textarea
              className="contact-form-textarea"
              rows="4"
              value={form.message}
              onChange={(event) => handleChange('message', event.target.value)}
              placeholder="Napisz, co warto poprawic albo dodac..."
            />
          </label>

          <label className="contact-form-field">
            <span>Podpis</span>
            <input
              type="text"
              value={form.authorName}
              onChange={(event) => handleChange('authorName', event.target.value)}
              placeholder="Opcjonalnie"
            />
          </label>

          <label className="contact-form-field">
            <span>Email</span>
            <input
              type="email"
              value={form.authorEmail}
              onChange={(event) => handleChange('authorEmail', event.target.value)}
              placeholder="Opcjonalnie"
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
              Zamknij
            </button>
            <button className="contact-form-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wysylanie...' : submitLabel}
            </button>
          </div>
        </form>
      )}

      {!isOpen && success && <p className="contact-form-feedback contact-form-feedback--success">{success}</p>}
    </div>
  )
}
