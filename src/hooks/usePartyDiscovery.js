import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../context/useLanguage'

async function nominatimGeocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  const response = await fetch(url, { headers: { 'Accept-Language': 'pl,en' } })
  const data = await response.json()
  if (!data.length) return null

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    name: data[0].display_name.split(',')[0].trim(),
  }
}

async function nominatimReverse(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
  const response = await fetch(url, { headers: { 'Accept-Language': 'pl,en' } })
  const data = await response.json()
  return data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(',')[0] || ''
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function usePartyDiscovery(upcomingOpenParties) {
  const { t } = useLanguage()
  const [nearbyInput, setNearbyInput] = useState('')
  const [nearbyRef, setNearbyRef] = useState(null)
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState('')
  const [partyCoords, setPartyCoords] = useState({})

  const handleNearbySearch = async (query = nearbyInput) => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    setNearbyLoading(true)
    setNearbyError('')

    try {
      const result = await nominatimGeocode(trimmedQuery)
      if (result) setNearbyRef(result)
      else setNearbyError(t('geocodingFailed'))
    } catch {
      setNearbyError(t('geocodingFailed'))
    } finally {
      setNearbyLoading(false)
    }
  }

  const handleNearbyGps = () => {
    if (!navigator.geolocation) {
      setNearbyError(t('gpsNotSupported'))
      return
    }

    setNearbyLoading(true)
    setNearbyError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const name = await nominatimReverse(latitude, longitude).catch(() => t('myLocation'))
        setNearbyRef({ lat: latitude, lng: longitude, name })
        setNearbyLoading(false)
      },
      () => {
        setNearbyError(t('gpsError'))
        setNearbyLoading(false)
      }
    )
  }

  const clearNearby = () => {
    setNearbyRef(null)
    setNearbyInput('')
    setNearbyError('')
  }

  useEffect(() => {
    if (!nearbyRef) return

    let cancelled = false
    const locationsToGeocode = upcomingOpenParties
      .map((party) => party.settings?.partyLocation)
      .filter(Boolean)
      .filter((location) => partyCoords[location] === undefined)

    if (!locationsToGeocode.length) return

    ;(async () => {
      for (const location of locationsToGeocode) {
        if (cancelled) break

        let result = null
        try {
          result = await nominatimGeocode(location)
        } catch {
          result = null
        }

        if (cancelled) break
        setPartyCoords((current) => ({ ...current, [location]: result }))
        await new Promise((resolve) => setTimeout(resolve, 350))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [nearbyRef, partyCoords, upcomingOpenParties])

  const partiesWithDistance = useMemo(() => {
    if (!nearbyRef) return upcomingOpenParties

    return upcomingOpenParties
      .map((party) => {
        const coords = partyCoords[party.settings?.partyLocation]
        const distance = coords
          ? haversineKm(nearbyRef.lat, nearbyRef.lng, coords.lat, coords.lng)
          : null

        return { ...party, _dist: distance }
      })
      .sort((a, b) => {
        if (a._dist == null && b._dist == null) return 0
        if (a._dist == null) return 1
        if (b._dist == null) return -1
        return a._dist - b._dist
      })
  }, [nearbyRef, partyCoords, upcomingOpenParties])

  return {
    nearbyInput,
    nearbyRef,
    nearbyLoading,
    nearbyError,
    partiesWithDistance,
    setNearbyInput,
    clearNearby,
    handleNearbySearch,
    handleNearbyGps,
  }
}
