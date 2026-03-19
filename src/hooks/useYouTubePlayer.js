import { useCallback, useEffect, useRef, useState } from 'react'

export function useYouTubePlayer({ enabled, currentVideoId, onPlaying, onEnded, onRecoverableError }) {
  const [ytPlayerState, setYtPlayerState] = useState(-1)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isReady, setIsReady] = useState(false)

  const playerRef = useRef(null)
  const playerDivRef = useRef(null)
  const playerReadyRef = useRef(false)
  const pendingVideoIdRef = useRef(null)
  const loadProgressIntervalRef = useRef(null)
  const liveCallbacksRef = useRef({
    currentVideoId,
    onPlaying,
    onEnded,
    onRecoverableError,
  })

  useEffect(() => {
    liveCallbacksRef.current = {
      currentVideoId,
      onPlaying,
      onEnded,
      onRecoverableError,
    }
  }, [currentVideoId, onPlaying, onEnded, onRecoverableError])

  const clearLoadProgressInterval = useCallback(() => {
    clearInterval(loadProgressIntervalRef.current)
    loadProgressIntervalRef.current = null
  }, [])

  const syncLoadProgress = useCallback(player => {
    setLoadProgress(Math.round((player?.getVideoLoadedFraction?.() ?? 0) * 100))
  }, [])

  const loadVideoById = useCallback((ytId, startSeconds) => {
    if (!ytId) return
    const arg = startSeconds > 0
      ? { videoId: ytId, startSeconds: Math.floor(startSeconds) }
      : { videoId: ytId }
    if (enabled && playerReadyRef.current && playerRef.current) {
      playerRef.current.loadVideoById(arg)
      return
    }
    pendingVideoIdRef.current = arg
  }, [enabled])

  const stopVideo = useCallback(() => {
    try {
      playerRef.current?.stopVideo()
    } catch (error) {
      void error
    }
  }, [])

  useEffect(() => {
    if (!enabled || !currentVideoId) return
    if (!playerReadyRef.current || !playerRef.current) {
      pendingVideoIdRef.current = { videoId: currentVideoId }
      return
    }
    playerRef.current.loadVideoById({ videoId: currentVideoId })
  }, [currentVideoId, enabled])

  useEffect(() => {
    if (!enabled) {
      playerReadyRef.current = false
      playerRef.current = null
      clearLoadProgressInterval()
      return
    }

    let alive = true
    let localPlayer = null

    const handleReady = () => {
      if (!alive) return
      playerRef.current = localPlayer
      playerReadyRef.current = true
      setIsReady(true)
      const nextVideoId = pendingVideoIdRef.current ?? liveCallbacksRef.current.currentVideoId
      if (!nextVideoId) return
      localPlayer.loadVideoById(typeof nextVideoId === 'string' ? { videoId: nextVideoId } : nextVideoId)
      pendingVideoIdRef.current = null
      setYtPlayerState(3)
    }

    const handleStateChange = (event) => {
      if (!alive) return

      setYtPlayerState(event.data)
      clearLoadProgressInterval()

      if (event.data === window.YT.PlayerState.BUFFERING) {
        syncLoadProgress(localPlayer)
        loadProgressIntervalRef.current = setInterval(() => {
          if (!alive) return
          const progress = Math.round((localPlayer?.getVideoLoadedFraction?.() ?? 0) * 100)
          setLoadProgress(progress)
          if (progress >= 100) clearLoadProgressInterval()
        }, 500)
      } else {
        syncLoadProgress(localPlayer)
      }

      if (event.data === window.YT.PlayerState.PLAYING) liveCallbacksRef.current.onPlaying?.(localPlayer)
      if (event.data === window.YT.PlayerState.ENDED) liveCallbacksRef.current.onEnded?.()
    }

    const handleError = (event) => {
      if (!alive) return
      liveCallbacksRef.current.onRecoverableError?.(event?.data)
    }

    const createPlayer = () => {
      if (!alive || !playerDivRef.current || localPlayer) return

      playerDivRef.current.innerHTML = ''
      const ytTarget = document.createElement('div')
      playerDivRef.current.appendChild(ytTarget)

      localPlayer = new window.YT.Player(ytTarget, {
        height: '202',
        width: '360',
        playerVars: {
          rel: 0,
          modestbranding: 1,
          autoplay: 1,
          controls: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: handleReady,
          onStateChange: handleStateChange,
          onError: handleError,
        },
      })
    }

    if (window.YT?.Player) {
      createPlayer()
    } else {
      window.onYouTubeIframeAPIReady = createPlayer
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
    }

    return () => {
      alive = false
      playerReadyRef.current = false
      playerRef.current = null
      clearLoadProgressInterval()
      try {
        localPlayer?.destroy()
      } catch (error) {
        void error
      }
    }
  }, [clearLoadProgressInterval, enabled, syncLoadProgress])

  return {
    playerDivRef,
    playerRef,
    isReady: enabled && isReady,
    ytPlayerState: enabled ? ytPlayerState : -1,
    loadProgress: enabled ? loadProgress : 0,
    loadVideoById,
    stopVideo,
  }
}
