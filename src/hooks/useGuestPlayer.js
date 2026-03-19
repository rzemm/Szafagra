import { useCallback, useEffect, useRef, useState } from 'react'
import { useYouTubePlayer } from './useYouTubePlayer'

function calcStartSeconds(jukeboxState) {
  if (!jukeboxState?.syncAt || jukeboxState?.syncPos == null) return 0
  const elapsed = (Date.now() - jukeboxState.syncAt.toMillis()) / 1000
  return Math.max(0, (jukeboxState.syncPos ?? 0) + elapsed)
}

export function useGuestPlayer({ jukeboxState, isPlaying }) {
  const [listening, setListening] = useState(false)
  const prevSongIdRef = useRef(null)

  const { playerDivRef, loadVideoById } = useYouTubePlayer({
    enabled: listening,
    currentVideoId: null,
    onPlaying: null,
    onEnded: null,
    onRecoverableError: null,
  })

  useEffect(() => {
    if (!listening || !isPlaying || !jukeboxState?.currentSong) return
    const { id, ytId } = jukeboxState.currentSong
    if (prevSongIdRef.current === id) return
    prevSongIdRef.current = id
    const startSeconds = calcStartSeconds(jukeboxState)
    loadVideoById(ytId, startSeconds)
  }, [listening, isPlaying, jukeboxState, loadVideoById])

  const toggleListening = useCallback(() => {
    setListening(prev => {
      if (!prev) prevSongIdRef.current = null
      return !prev
    })
  }, [])

  return { listening, toggleListening, playerDivRef }
}
