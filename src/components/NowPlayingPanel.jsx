import { useState } from 'react'
import { formatTime } from '../lib/jukebox'

export function NowPlayingPanel({ isPlaying, currentSong, remaining, ytPlayerState, loadProgress, playerRef, playerDivRef, advanceToWinner, skipThreshold, skipCount, startJukeboxWith, stopJukebox, activePlaylistId, activePlaylist }) {
  const [volume, setVolume] = useState(80)

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value)
    setVolume(val)
    playerRef.current?.setVolume(val)
  }

  return (
    <div className="admin-col admin-col-center">
      <div className="player-card">
        <div className="yt-wrapper">
          <div ref={playerDivRef} />
          <div className="yt-click-blocker" />
          {!isPlaying && (
            <div className="player-overlay">
              <span className="vinyl-icon">🎵</span>
              <p>Wybierz playlistę i naciśnij START</p>
            </div>
          )}
        </div>
        {isPlaying && currentSong && (
          <div className="now-playing">
            <span className="now-label">TERAZ GRA{ytPlayerState === 3 && loadProgress < 100 && <span className="load-pct"> · {loadProgress}%</span>}</span>
            <span className="now-title">{currentSong.title}</span>
            {remaining != null && <span className="now-timer">{formatTime(remaining)}</span>}
          </div>
        )}
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
              <button
                className="btn-ctrl"
                onClick={() => ytPlayerState === 1 ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo()}
              >
                {ytPlayerState === 1 ? '⏸' : '▶'}
              </button>
              <button className="btn-ctrl" onClick={advanceToWinner}>⏭</button>
              <button className="btn-ctrl btn-ctrl-stop" onClick={stopJukebox}>■ STOP</button>
            </>
          )}
        </div>
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
      </div>
      {isPlaying && skipThreshold > 0 && <div className="skip-card"><span className="skip-count">{skipCount}/{skipThreshold} głosów na pominięcie</span></div>}
    </div>
  )
}
