import { app } from '../firebase'
import { hasAnalyticsConsent } from './consentService'

let analyticsInitPromise = null
let analyticsModulePromise = null

async function loadAnalyticsModule() {
  if (!analyticsModulePromise) {
    analyticsModulePromise = import('firebase/analytics')
  }

  return analyticsModulePromise
}

async function applyConsent(consentGranted) {
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  if (!measurementId) return

  const { isSupported, getAnalytics, setConsent } = await loadAnalyticsModule()
  const supported = await isSupported().catch(() => false)

  if (!supported) return

  const analytics = getAnalytics(app)
  setConsent({
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: consentGranted ? 'granted' : 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'denied',
    security_storage: 'granted',
  })

  return analytics
}

export async function enableAnalyticsIfConsented() {
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID

  if (!measurementId || !hasAnalyticsConsent()) {
    return null
  }

  if (analyticsInitPromise) {
    return analyticsInitPromise
  }

  analyticsInitPromise = (async () => {
    const analytics = await applyConsent(true)
    if (!analytics || !hasAnalyticsConsent()) {
      return null
    }

    return analytics
  })()

  return analyticsInitPromise
}

export async function syncAnalyticsConsent(consentGranted) {
  if (consentGranted) {
    return enableAnalyticsIfConsented()
  }

  await applyConsent(false).catch(() => null)
  return null
}
