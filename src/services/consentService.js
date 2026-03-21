const CONSENT_STORAGE_KEY = 'szafagra:cookie-consent'
const CONSENT_EVENT_NAME = 'szafagra:cookie-consent-change'
const CONSENT_OPEN_EVENT_NAME = 'szafagra:cookie-consent-open'
const CONSENT_VERSION = '2026-03-21'

function createDefaultState() {
  return {
    version: CONSENT_VERSION,
    decidedAt: null,
    analytics: false,
  }
}

function isValidConsentState(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof value.version === 'string' &&
    Object.prototype.hasOwnProperty.call(value, 'decidedAt') &&
    typeof value.analytics === 'boolean',
  )
}

function notifyConsentChange(state) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: state }))
}

export function getConsentState() {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  try {
    const rawValue = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!rawValue) return createDefaultState()

    const parsedValue = JSON.parse(rawValue)
    if (!isValidConsentState(parsedValue)) {
      return createDefaultState()
    }

    if (parsedValue.version !== CONSENT_VERSION) {
      return createDefaultState()
    }

    return parsedValue
  } catch {
    return createDefaultState()
  }
}

export function saveConsentState(inputState) {
  const nextState = {
    version: CONSENT_VERSION,
    decidedAt: inputState.decidedAt ?? new Date().toISOString(),
    analytics: Boolean(inputState.analytics),
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextState))
    } catch {
      // Ignore storage failures and keep the in-memory flow working.
    }
  }

  notifyConsentChange(nextState)
  return nextState
}

export function hasAnalyticsConsent() {
  return getConsentState().analytics
}

export function hasConsentDecision() {
  return Boolean(getConsentState().decidedAt)
}

export function acceptAllConsent() {
  return saveConsentState({ analytics: true })
}

export function rejectOptionalConsent() {
  return saveConsentState({ analytics: false })
}

export function openConsentSettings() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT_NAME))
}

export function subscribeToConsentChanges(listener) {
  if (typeof window === 'undefined') return () => {}

  const handleChange = (event) => {
    listener(event.detail ?? getConsentState())
  }

  const handleStorage = (event) => {
    if (event.key === CONSENT_STORAGE_KEY) {
      listener(getConsentState())
    }
  }

  window.addEventListener(CONSENT_EVENT_NAME, handleChange)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(CONSENT_EVENT_NAME, handleChange)
    window.removeEventListener('storage', handleStorage)
  }
}

export function subscribeToConsentSettingsOpen(listener) {
  if (typeof window === 'undefined') return () => {}

  window.addEventListener(CONSENT_OPEN_EVENT_NAME, listener)
  return () => window.removeEventListener(CONSENT_OPEN_EVENT_NAME, listener)
}
