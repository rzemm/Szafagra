import { useEffect, useState } from 'react'
import { subscribeLatestRooms, subscribeOwnedRooms, subscribeOpenParties, subscribePublicRooms, subscribeRoomsByIds, subscribeUserRoomsDoc } from '../services/jukeboxService'

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
          .filter((r) => r.settings?.partyDate && r.settings.partyDate > now)
          .sort((a, b) => a.settings.partyDate.localeCompare(b.settings.partyDate))
      )
    })
  }, [enabled])

  return enabled ? parties : []
}

export function useTopRatedRooms(enabled) {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    if (!enabled) return
    return subscribePublicRooms((allRooms) => {
      setRooms(
        allRooms
          .filter((r) => r.settings?.isVisible !== false && (r.songs?.length ?? 0) > 0)
          .map((r) => {
            const vals = Object.values(r.ratings ?? {})
            const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
            return { ...r, _avgRating: avg, _ratingCount: vals.length }
          })
          .filter((r) => r._ratingCount > 0)
          .sort((a, b) => b._avgRating - a._avgRating)
          .slice(0, 5)
      )
    })
  }, [enabled])

  return enabled ? rooms : []
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

export function useGuestVisitedRooms(uid, enabled) {
  const [guestOf, setGuestOf] = useState({})
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    if (!enabled || !uid) return
    return subscribeUserRoomsDoc(uid, (data) => {
      setGuestOf(data.guestOf ?? {})
    })
  }, [enabled, uid])

  useEffect(() => {
    if (!enabled || !uid) return
    const entries = Object.entries(guestOf)
      .sort((a, b) => (b[1].lastVisited?.toMillis?.() ?? 0) - (a[1].lastVisited?.toMillis?.() ?? 0))
      .slice(0, 8)

    if (entries.length === 0) {
      setRooms([])
      return
    }

    const roomIds = entries.map(([id]) => id)
    return subscribeRoomsByIds(roomIds, (fetchedRooms) => {
      const sorted = roomIds
        .map((id) => fetchedRooms.find((r) => r.id === id))
        .filter(Boolean)
        .filter((r) => r.ownerId !== uid)
      setRooms(sorted)
    })
  }, [enabled, uid, guestOf])

  return enabled && uid ? rooms : []
}
