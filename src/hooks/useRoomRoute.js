import { useCallback, useEffect, useMemo } from 'react'

const PREVIEW_ROOM_KEY = 'szafagra.previewRoomId'

function getBaseUrl() {
  return new URL(window.location.origin + window.location.pathname)
}

export function useRoomRoute() {
  const roomParam = useMemo(() => new URLSearchParams(window.location.search).get('room')?.trim() ?? '', [])
  const isViewMode = useMemo(() => {
    if (!roomParam) return false
    return window.sessionStorage.getItem(PREVIEW_ROOM_KEY) === roomParam
  }, [roomParam])

  useEffect(() => {
    if (!roomParam) {
      window.sessionStorage.removeItem(PREVIEW_ROOM_KEY)
    }
  }, [roomParam])

  const buildRoomUrl = useCallback((roomValue, options = {}) => {
    void options
    const url = getBaseUrl()
    if (roomValue) url.searchParams.set('room', roomValue)
    return url.toString()
  }, [])

  const navigateToRoom = useCallback((roomValue, options = {}) => {
    if (options.previewMode && roomValue) {
      window.sessionStorage.setItem(PREVIEW_ROOM_KEY, roomValue)
    } else {
      window.sessionStorage.removeItem(PREVIEW_ROOM_KEY)
    }
    window.location.href = buildRoomUrl(roomValue, options)
  }, [buildRoomUrl])

  return {
    roomParam,
    hasRoomParam: !!roomParam,
    isViewMode,
    currentUrl: window.location.href,
    buildRoomUrl,
    navigateToRoom,
  }
}
