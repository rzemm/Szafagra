import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const STATE_ID = 'main'

export function useRoomSubscriptions(roomId, setActivePlaylistId) {
  const [playlists, setPlaylists] = useState([])
  const [jukeboxState, setJukeboxState] = useState(null)
  const [settings, setSettings] = useState({})
  const [guestToken, setGuestToken] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (!roomId) return

    const unsubPlaylists = onSnapshot(collection(db, 'rooms', roomId, 'playlists'), snap => {
      const nextPlaylists = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0))
      setPlaylists(nextPlaylists)
      setActivePlaylistId(id => id ?? (nextPlaylists[0]?.id ?? null))
    })

    const unsubState = onSnapshot(doc(db, 'rooms', roomId, 'state', STATE_ID), snap => {
      setJukeboxState(snap.exists() ? snap.data() : null)
    })

    const unsubRoom = onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (snap.exists()) {
        setSettings(snap.data().settings ?? {})
        setGuestToken(snap.data().guestToken ?? null)
      }
    })

    const unsubSuggestions = onSnapshot(collection(db, 'rooms', roomId, 'suggestions'), snap => {
      setSuggestions(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0))
      )
    })

    return () => {
      unsubPlaylists()
      unsubState()
      unsubRoom()
      unsubSuggestions()
    }
  }, [roomId, setActivePlaylistId])

  return { playlists, jukeboxState, settings, guestToken, suggestions }
}
