import { useEffect, useState } from 'react'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export function useRoomAuth() {
  const [user, setUser] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const roomParam = new URLSearchParams(window.location.search).get('room')

    const unsub = onAuthStateChanged(auth, async currentUser => {
      if (!currentUser) {
        await signInAnonymously(auth)
        return
      }

      setUser(currentUser)
      const nextRoomId = roomParam || currentUser.uid
      const owner = !roomParam || roomParam === currentUser.uid

      setRoomId(nextRoomId)
      setIsOwner(owner)

      if (owner) {
        const url = new URL(window.location.href)
        if (!url.searchParams.get('room')) {
          url.searchParams.set('room', currentUser.uid)
          window.history.replaceState({}, '', url.toString())
        }
        await setDoc(doc(db, 'rooms', currentUser.uid), { ownerId: currentUser.uid }, { merge: true })
      }

      setAuthReady(true)
    })

    return () => unsub()
  }, [])

  return { user, roomId, isOwner, authReady }
}
