import { useEffect, useMemo, useState } from 'react'
import {
  subscribeOpenParties,
  subscribeOwnedRooms,
  subscribeRoomsByIds,
  subscribeUserRoomsDoc,
} from '../services/jukeboxService'

export function useOwnedRooms(uid, enabled) {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    if (!enabled || !uid) return
    return subscribeOwnedRooms(uid, setRooms)
  }, [enabled, uid])

  return enabled && uid ? rooms : []
}

export function useUpcomingOpenParties(enabled) {
  const [parties, setParties] = useState([])

  useEffect(() => {
    if (!enabled) return
    return subscribeOpenParties((rooms) => {
      const now = new Date().toISOString()
      setParties(
        rooms
          .filter((room) => room.settings?.partyDate && room.settings.partyDate > now)
          .sort((a, b) => a.settings.partyDate.localeCompare(b.settings.partyDate))
      )
    })
  }, [enabled])

  return enabled ? parties : []
}

export function useGuestVisitedRooms(uid, enabled) {
  const [guestOf, setGuestOf] = useState({})
  const [rooms, setRooms] = useState([])
  const entries = useMemo(() => Object.entries(guestOf)
    .sort((a, b) => (b[1].lastVisited?.toMillis?.() ?? 0) - (a[1].lastVisited?.toMillis?.() ?? 0))
    .slice(0, 8), [guestOf])

  useEffect(() => {
    if (!enabled || !uid) return
    return subscribeUserRoomsDoc(uid, (data) => {
      setGuestOf(data.guestOf ?? {})
    })
  }, [enabled, uid])

  useEffect(() => {
    if (!enabled || !uid || entries.length === 0) return

    const roomIds = entries.map(([id]) => id)
    return subscribeRoomsByIds(roomIds, (fetchedRooms) => {
      const sortedRooms = roomIds
        .map((id) => fetchedRooms.find((room) => room.id === id))
        .filter(Boolean)
        .filter((room) => room.ownerId !== uid)
      setRooms(sortedRooms)
    })
  }, [enabled, uid, entries])

  if (!enabled || !uid) return []
  return entries.length === 0 ? [] : rooms
}
