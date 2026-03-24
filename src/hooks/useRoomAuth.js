import { useEffect, useState } from 'react'
import { signInAnonymously, signInWithPopup, signOut, updateProfile, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { ensurePublicRoomAccess, recordGuestVisit, hasSetUsername, claimUsername } from '../services/jukeboxService'

const googleProvider = new GoogleAuthProvider()

export function useRoomAuth(roomParam) {
  const [user, setUser] = useState(null)
  const [roomId, setRoomId] = useState(null)
  const [roomType, setRoomType] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [canEditRoom, setCanEditRoom] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [roomError, setRoomError] = useState('')
  const [needsUsername, setNeedsUsername] = useState(false)

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Google sign-in failed', err)
    }
  }

  const signOutUser = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign out failed', err)
    }
  }

  const updateDisplayName = async (name) => {
    if (!auth.currentUser) return
    try {
      await updateProfile(auth.currentUser, { displayName: name })
      setUser((prev) => ({ ...prev, displayName: name }))
    } catch (err) {
      console.error('updateProfile failed', err)
    }
  }

  const confirmUsername = async (name) => {
    if (!auth.currentUser) return
    await claimUsername(auth.currentUser.uid, name)
    await updateProfile(auth.currentUser, { displayName: name })
    setUser((prev) => ({ ...prev, displayName: name }))
    setNeedsUsername(false)
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async currentUser => {
      setRoomError('')

      if (!currentUser) {
        try {
          await signInAnonymously(auth)
        } catch (err) {
          console.error('Anonymous sign-in failed', err)
          setRoomError('Nie udało się połączyć z szafą.')
          setAuthReady(true)
        }
        return
      }

      setUser(currentUser)

      if (!currentUser.isAnonymous) {
        hasSetUsername(currentUser.uid).then(has => {
          if (!has) setNeedsUsername(true)
        }).catch(() => {})
      }

      if (!roomParam) {
        setRoomId(null)
        setRoomType(null)
        setIsOwner(false)
        setCanEditRoom(false)
        setAuthReady(true)
        return
      }

      try {
        const tokenSnap = await getDoc(doc(db, 'tokenIndex', roomParam))
        const resolvedRoomId = tokenSnap.exists() ? tokenSnap.data().roomId : roomParam
        const roomSnap = await getDoc(doc(db, 'rooms', resolvedRoomId))

        if (!roomSnap.exists()) {
          setRoomId(null)
          setRoomType(null)
          setIsOwner(false)
          setCanEditRoom(false)
          setRoomError('Ta szafa nie istnieje albo link jest nieprawidłowy.')
          setAuthReady(true)
          return
        }

        const room = roomSnap.data()
        const owner = !currentUser.isAnonymous && room.ownerId === currentUser.uid
        const canEdit = room.type === 'public' ? true : owner

        if (room.type === 'public') {
          await ensurePublicRoomAccess(currentUser.uid, resolvedRoomId)
        } else if (!owner && !currentUser.isAnonymous) {
          recordGuestVisit(currentUser.uid, resolvedRoomId, roomParam).catch(() => {})
        }

        setRoomId(resolvedRoomId)
        setRoomType(room.type ?? null)
        setIsOwner(owner)
        setCanEditRoom(canEdit)
      } catch (err) {
        console.error('Room auth failed', err)
        setRoomError('Nie udało się otworzyć szafy.')
        setRoomId(null)
        setRoomType(null)
        setIsOwner(false)
        setCanEditRoom(false)
      }

      setAuthReady(true)
    })

    return () => unsub()
  }, [roomParam])

  return { user, roomId, roomType, isOwner, canEditRoom, authReady, roomError, needsUsername, confirmUsername, signInWithGoogle, signOutUser, updateDisplayName }
}
