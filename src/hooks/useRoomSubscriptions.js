import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useRoomSubscriptions(roomId) {
  const [room, setRoom] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (!roomId) return

    const unsubRoom = onSnapshot(doc(db, 'rooms', roomId), snap => {
      setRoom(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })

    const unsubSuggestions = onSnapshot(collection(db, 'rooms', roomId, 'suggestions'), snap => {
      setSuggestions(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
      )
    })

    return () => {
      unsubRoom()
      unsubSuggestions()
    }
  }, [roomId])

  return {
    room: roomId ? room : null,
    suggestions: roomId ? suggestions : [],
  }
}
