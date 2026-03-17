import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const STATE_ID = 'main'

export function useRoomSubscriptions(roomId, setActivePlaylistId) {
  const [playlists, setPlaylists] = useState([])
  const [jukeboxState, setJukeboxState] = useState(null)
  const [settings, setSettings] = useState({})

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
      if (snap.exists()) setSettings(snap.data().settings ?? {})
    })

    return () => {
      unsubPlaylists()
      unsubState()
      unsubRoom()
    }
  }, [roomId, setActivePlaylistId])

  return { playlists, jukeboxState, settings }
}
