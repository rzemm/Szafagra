import { formatTime } from '../lib/jukebox'

export function NowPlayingPanel({ isPlaying, currentSong, remaining, ytPlayerState, loadProgress, playerRef, playerDivRef, advanceToWinner, skipThreshold, skipCount }) {
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
        {isPlaying && (
          <div className="player-controls">
            <button className="btn-playpause" onClick={() => ytPlayerState === 1 ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo()}>{ytPlayerState === 1 ? '⏸' : '▶'}</button>
            <button className="btn-next" onClick={advanceToWinner}>⏭ Następna</button>
          </div>
        )}
      </div>
      {isPlaying && skipThreshold > 0 && <div className="skip-card"><span className="skip-count">{skipCount}/{skipThreshold} głosów na pominięcie</span></div>}
    </div>
  )
}
