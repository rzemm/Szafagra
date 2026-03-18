import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { formatTime } from '../lib/jukebox'

export function NowPlayingPanel({ isPlaying, currentSong, remaining, ytPlayerState, loadProgress, playerRef, playerDivRef, advanceToWinner, skipThreshold, skipCount, startJukeboxWith, stopJukebox, activePlaylistId, activePlaylist }) {
  const [volume, setVolume] = useState(80)
  const [discoMode, setDiscoMode] = useState(true)
  const [blurAmount, setBlurAmount] = useState(8)

  useEffect(() => {
    document.body.classList.toggle('disco-mode', discoMode)
    return () => document.body.classList.remove('disco-mode')
  }, [discoMode])

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value)
    setVolume(val)
    playerRef.current?.setVolume(val)
  }

  const playPauseClick = () => ytPlayerState === 1
    ? playerRef.current?.pauseVideo()
    : playerRef.current?.playVideo()

  return (
    <>
      <div className="admin-col admin-col-center">
        <div className={`player-card${discoMode ? ' player-card--disco' : ''}`}>

          {/* YouTube player div — always mounted, class changes for disco */}
          <div
            className={discoMode ? 'yt-player-disco' : 'yt-wrapper'}
            style={discoMode ? { filter: `blur(${blurAmount}px)` } : undefined}
          >
            <div ref={playerDivRef} />
            {!discoMode && <div className="yt-click-blocker" />}
            {!isPlaying && !discoMode && (
              <div className="player-overlay">
                <span className="vinyl-icon">🎵</span>
                <p>Wybierz playlistę i naciśnij START</p>
              </div>
            )}
          </div>

          {!discoMode && isPlaying && currentSong && (
            <div className="now-playing">
              <span className="now-label">
                TERAZ GRA{ytPlayerState === 3 && loadProgress < 100 && <span className="load-pct"> · {loadProgress}%</span>}
              </span>
              <span className="now-title">{currentSong.title}</span>
              {remaining != null && <span className="now-timer">{formatTime(remaining)}</span>}
            </div>
          )}

          {!discoMode && (
            <div className="player-controls">
              {!isPlaying ? (
                <button
                  className="btn-ctrl btn-ctrl-start"
                  onClick={() => startJukeboxWith(activePlaylistId)}
                  disabled={!activePlaylistId || !activePlaylist?.songs.length}
                >
                  ▶ START
                </button>
              ) : (
                <>
                  <button className="btn-ctrl btn-ctrl-play" onClick={playPauseClick}>
                    {ytPlayerState === 1 ? '⏸' : '▶'}
                  </button>
                  <button className="btn-ctrl btn-ctrl-skip" onClick={advanceToWinner}>⏭</button>
                  <button className="btn-ctrl btn-ctrl-stop" onClick={stopJukebox}>■ STOP</button>
                </>
              )}
              <button
                className="btn-ctrl btn-ctrl-disco"
                onClick={() => setDiscoMode(true)}
                title="Tryb disco"
              >
                🪩
              </button>
            </div>
          )}

          {!discoMode && (
            <div className="volume-row">
              <span className="volume-icon">🔈</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
              <span className="volume-icon">🔊</span>
            </div>
          )}

        </div>

        {!discoMode && isPlaying && skipThreshold > 0 && (
          <div className="skip-card">
            <span className="skip-count">{skipCount}/{skipThreshold} głosów na pominięcie</span>
          </div>
        )}
      </div>

      {/* Disco bar rendered via portal directly into <body> to avoid grid/stacking issues */}
      {discoMode && createPortal(
        <div className="disco-bar">
          <div className="disco-bar-info">
            {isPlaying && currentSong ? (
              <>
                <span className="now-label">TERAZ GRA</span>
                <span className="disco-bar-title">{currentSong.title}</span>
                {remaining != null && <span className="now-timer">{formatTime(remaining)}</span>}
              </>
            ) : (
              <span className="now-label">JUKEBOX</span>
            )}
          </div>

          <div className="disco-bar-controls">
            {!isPlaying ? (
              <button
                className="btn-ctrl btn-ctrl-start"
                onClick={() => startJukeboxWith(activePlaylistId)}
                disabled={!activePlaylistId || !activePlaylist?.songs.length}
              >
                ▶ START
              </button>
            ) : (
              <>
                <button className="btn-ctrl btn-ctrl-play" onClick={playPauseClick}>
                  {ytPlayerState === 1 ? '⏸' : '▶'}
                </button>
                <button className="btn-ctrl btn-ctrl-skip" onClick={advanceToWinner}>⏭</button>
                <button className="btn-ctrl btn-ctrl-stop" onClick={stopJukebox}>■ STOP</button>
              </>
            )}
          </div>

          <div className="disco-bar-extras">
            <span className="volume-icon">🔈</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider disco-slider"
            />
            <span className="volume-icon">🔊</span>
            <span className="disco-blur-label">Rozmycie</span>
            <input
              type="range"
              min="0"
              max="20"
              value={blurAmount}
              onChange={(e) => setBlurAmount(Number(e.target.value))}
              className="volume-slider disco-slider"
            />
            <button className="btn-ctrl btn-ctrl-disco-exit" onClick={() => setDiscoMode(false)}>
              ✕ Disco
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
