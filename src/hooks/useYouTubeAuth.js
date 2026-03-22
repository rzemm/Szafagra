import { useState } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { firebaseConfig } from '../firebase'

function getYtAuth() {
  const existing = getApps().find((a) => a.name === 'yt-oauth')
  return getAuth(existing ?? initializeApp(firebaseConfig, 'yt-oauth'))
}

export function useYouTubeAuth() {
  const [accessToken, setAccessToken] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(null)

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
        setError(err.message)
      }
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = () => {
    setAccessToken(null)
    setError(null)
  }

  return { accessToken, connecting, error, connect, disconnect }
}
