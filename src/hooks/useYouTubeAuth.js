import { useMemo, useState } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { firebaseConfig } from '../firebase'
import { useLanguage } from '../context/useLanguage'

function getYtAuth() {
  const ytFirebaseConfig = {
    apiKey: import.meta.env.VITE_YT_FIREBASE_API_KEY || firebaseConfig.apiKey,
    authDomain: import.meta.env.VITE_YT_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
    projectId: import.meta.env.VITE_YT_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
    storageBucket: import.meta.env.VITE_YT_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_YT_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
    appId: import.meta.env.VITE_YT_FIREBASE_APP_ID || firebaseConfig.appId,
  }
  const existing = getApps().find((a) => a.name === 'yt-oauth')
  return getAuth(existing ?? initializeApp(ytFirebaseConfig, 'yt-oauth'))
}

function getYouTubeAuthErrorMessage(err, t) {
  switch (err?.code) {
    case 'auth/popup-blocked':
      return t('ytAuthPopupBlocked')
    case 'auth/popup-closed-by-user':
      return ''
    case 'auth/cancelled-popup-request':
      return t('ytAuthCancelled')
    case 'auth/unauthorized-domain':
      return t('ytAuthUnauthorizedDomain')
    case 'auth/operation-not-allowed':
      return t('ytAuthOperationNotAllowed')
    case 'auth/network-request-failed':
      return t('ytAuthNetworkError')
    default: {
      const rawMessage = (err?.customData?._tokenResponse?.errorMessage || err?.message || '').toLowerCase()

      if (rawMessage.includes('redirect_uri_mismatch') || rawMessage.includes('origin_mismatch')) {
        return t('ytAuthRedirectMismatch')
      }
      if (rawMessage.includes('access blocked') || rawMessage.includes('app has not completed the google verification process')) {
        return t('ytAuthAccessBlocked')
      }
      if (rawMessage.includes('invalid client') || rawMessage.includes('deleted_client')) {
        return t('ytAuthClientConfigError')
      }

      return t('ytAuthGenericError')
    }
  }
}

export function useYouTubeAuth() {
  const { t } = useLanguage()
  const [accessToken, setAccessToken] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)
  const helpText = useMemo(() => ({
    title: t('ytAuthHelpTitle'),
    body: t('ytAuthHelpBody'),
  }), [t])

  const connect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('https://www.googleapis.com/auth/youtube.readonly')
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(getYtAuth(), provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      setAccessToken(credential.accessToken)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getYouTubeAuthErrorMessage(err, t))
      }
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    setAccessToken(null)
    setError(null)
  }

  return { accessToken, connecting, error, helpText, connect, disconnect }
}
