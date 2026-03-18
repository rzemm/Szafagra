import { useEffect, useState } from 'react'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { genId } from '../lib/jukebox'

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

      if (!roomParam || roomParam === currentUser.uid) {
        // Owner flow
        const roomRef = doc(db, 'rooms', currentUser.uid)
        const roomSnap = await getDoc(roomRef)
        let guestToken = roomSnap.exists() ? roomSnap.data().guestToken : null
        if (!guestToken) {
          guestToken = genId()
          await setDoc(doc(db, 'tokenIndex', guestToken), { roomId: currentUser.uid })
        }
        await setDoc(roomRef, { ownerId: currentUser.uid, guestToken }, { merge: true })

        const url = new URL(window.location.href)
        if (!url.searchParams.get('room')) {
          url.searchParams.set('room', currentUser.uid)
          window.history.replaceState({}, '', url.toString())
        }

        setRoomId(currentUser.uid)
        setIsOwner(true)
      } else {
        // Guest flow — resolve guestToken → real roomId
        const tokenSnap = await getDoc(doc(db, 'tokenIndex', roomParam))
        const resolvedRoomId = tokenSnap.exists() ? tokenSnap.data().roomId : roomParam

        setRoomId(resolvedRoomId)
        setIsOwner(resolvedRoomId === currentUser.uid)
      }

      setAuthReady(true)
    })

    return () => unsub()
  }, [])

  return { user, roomId, isOwner, authReady }
}
