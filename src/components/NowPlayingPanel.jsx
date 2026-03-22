import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { formatTime } from '../lib/jukebox'
import { useLanguage } from '../context/LanguageContext'

export function NowPlayingPanel({ isPlaying, currentSong, remaining, ytPlayerState, loadProgress, playerRef, playerDivRef, playerReady, advanceToWinner, skipThreshold, skipCount, startJukebox, stopJukebox, room, canEditRoom }) {
  const { t } = useLanguage()
  const [volume, setVolume] = useState(80)
  const [prevVolume, setPrevVolume] = useState(80)
  const [discoMode, setDiscoMode] = useState(true)
  const [blurAmount, setBlurAmount] = useState(8)

  useEffect(() => {
    document.body.classList.toggle('disco-mode', discoMode)
    return () => document.body.classList.remove('disco-mode')
  }, [discoMode])

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value)
    setVolume(val)
    if (val > 0) setPrevVolume(val)
    playerRef.current?.setVolume(val)
  }

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume)
      setVolume(0)
      playerRef.current?.setVolume(0)
    } else {
      const restore = prevVolume > 0 ? prevVolume : 80
      setVolume(restore)
      playerRef.current?.setVolume(restore)
    }
  }

  const playPauseClick = () => ytPlayerState === 1
    ? playerRef.current?.pauseVideo()
    : playerRef.current?.playVideo()

  return (
    <>
      <div className="admin-col admin-col-center">
        <div className={`player-card${discoMode ? ' player-card--disco' : ''}`}>
          <div
            className={discoMode ? 'yt-player-disco' : 'yt-wrapper'}
            style={discoMode ? { filter: `blur(${blurAmount}px)` } : undefined}
          >
            <div ref={playerDivRef} />
            {!discoMode && <div className="yt-click-blocker" />}
            {!isPlaying && !discoMode && (
              <div className="player-overlay">
                <span className="vinyl-icon">🎵</span>
                <p>{playerReady ? t('addSongsAndStart') : t('loadingPlayer')}</p>
              </div>
            )}
          </div>

          {!discoMode && isPlaying && currentSong && (
            <div className="now-playing">
              <span className="now-label">
                {t('nowPlaying')}{ytPlayerState === 3 && loadProgress < 100 && <span className="load-pct"> · {loadProgress}%</span>}
              </span>
              <span className="now-title">{currentSong.title}</span>
              {remaining != null && <span className="now-timer">{formatTime(remaining)}</span>}
            </div>
          )}

          {!discoMode && (
            <div className="player-controls">
              {canEditRoom && (!isPlaying ? (
                <button
                  className="btn-ctrl btn-ctrl-start"
                  onClick={startJukebox}
                  disabled={!room?.songs?.length || !playerReady}
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
              ))}
              <button
                className="btn-ctrl btn-ctrl-disco"
                onClick={() => setDiscoMode(true)}
                title={t('discoModeTitle')}
              >
                🪩
              </button>
            </div>
          )}

          {!discoMode && (
            <div className="volume-row">
              <button className="volume-icon volume-mute-btn" onClick={toggleMute} title={volume === 0 ? 'Włącz dźwięk' : 'Wycisz'}>
                {volume === 0 ? '🔇' : '🔈'}
              </button>
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
            <span className="skip-count">{skipCount}/{skipThreshold} {t('votesToSkip')}</span>
          </div>
        )}
      </div>

      {discoMode && createPortal(
        <div className="disco-bar">
          <div className="disco-bar-info">
            {isPlaying && currentSong ? (
              <>
                <span className="disco-bar-title">{currentSong.title}</span>
                {remaining != null && <span className="now-timer">{formatTime(remaining)}</span>}
              </>
            ) : (
              <span className="now-label">JUKEBOX</span>
            )}
          </div>

          <div className="disco-bar-controls">
            {canEditRoom && (!isPlaying ? (
              <button
                className="btn-ctrl btn-ctrl-start"
                onClick={startJukebox}
                disabled={!room?.songs?.length || !playerReady}
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
            ))}
          </div>

          <div className="disco-bar-extras">
            <button className="volume-icon volume-mute-btn" onClick={toggleMute} title={volume === 0 ? 'Włącz dźwięk' : 'Wycisz'}>
              {volume === 0 ? '🔇' : '🔈'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider disco-slider"
            />
            <span className="volume-icon">🔊</span>
            <button
              className="btn-ctrl disco-blur-btn"
              onClick={() => setBlurAmount((v) => v === 0 ? 8 : 0)}
            >{t('blurLabel')}: {blurAmount === 0 ? t('blurOff') : blurAmount}</button>
            <input
              type="range"
              min="0"
              max="20"
              value={blurAmount}
              onChange={(e) => setBlurAmount(Number(e.target.value))}
              className="volume-slider disco-slider"
            />
            <button className="btn-ctrl btn-ctrl-disco-exit" onClick={() => setDiscoMode(false)}>
              {t('exitDisco')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
