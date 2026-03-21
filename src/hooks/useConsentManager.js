import { useEffect, useState } from 'react'
import {
  acceptAllConsent,
  getConsentState,
  openConsentSettings,
  rejectOptionalConsent,
  saveConsentState,
  subscribeToConsentChanges,
  subscribeToConsentSettingsOpen,
} from '../services/consentService'
import { syncAnalyticsConsent } from '../services/analyticsService'

export function useConsentManager() {
  const [consentState, setConsentState] = useState(() => getConsentState())
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => subscribeToConsentChanges(setConsentState), [])
  useEffect(() => subscribeToConsentSettingsOpen(() => setIsSettingsOpen(true)), [])

  useEffect(() => {
    syncAnalyticsConsent(consentState.analytics)
  }, [consentState.analytics])

  const acceptAll = () => {
    const nextState = acceptAllConsent()
    setConsentState(nextState)
    setIsSettingsOpen(false)
  }

  const rejectOptional = () => {
    const nextState = rejectOptionalConsent()
    setConsentState(nextState)
    setIsSettingsOpen(false)
  }

  const savePreferences = ({ analytics }) => {
    const nextState = saveConsentState({ analytics })
    setConsentState(nextState)
    setIsSettingsOpen(false)
  }

  return {
    consentState,
    hasDecision: Boolean(consentState.decidedAt),
    isBannerVisible: !consentState.decidedAt,
    isSettingsOpen,
    openSettings: () => setIsSettingsOpen(true),
    openSettingsLink: openConsentSettings,
    closeSettings: () => setIsSettingsOpen(false),
    acceptAll,
    rejectOptional,
    savePreferences,
  }
}
