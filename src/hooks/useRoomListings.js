import { useEffect, useState } from 'react'
import { subscribeLatestRooms, subscribeOwnedRooms } from '../services/jukeboxService'

export function useOwnedRooms(uid, enabled) {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    if (!enabled || !uid) return
    return subscribeOwnedRooms(uid, setRooms)
  }, [enabled, uid])

  return enabled && uid ? rooms : []
}

export function useLatestForeignRooms(uid, enabled) {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    if (!enabled || !uid) return
    return subscribeLatestRooms((latestRooms) => {
      setRooms(
        latestRooms
          .filter((room) => room.ownerId !== uid)
          .filter((room) => (room.songs?.length ?? 0) > 0)
          .filter((room) => room.settings?.isVisible !== false)
          .slice(0, 5)
      )
    })
  }, [enabled, uid])

  return enabled && uid ? rooms : []
}
