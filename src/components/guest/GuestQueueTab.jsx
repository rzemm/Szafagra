import { formatTime } from '../../lib/jukebox'

export function GuestQueueTab({
  isPlaying,
  skipThreshold,
  mySkipVote,
  voteSkip,
  currentSong,
  remaining,
  queue,
  showThumbs,
  t,
}) {
  return (
    <div className="guest-tab-panel">
      {isPlaying && skipThreshold > 0 && (
        <div className="guest-skip-row guest-skip-row--top">
          <button className={`guest-skip-btn${mySkipVote ? ' active' : ''}`} onClick={voteSkip}>
            {mySkipVote ? t('wantToSkip') : t('skipCurrent')}
          </button>
        </div>
      )}

      {isPlaying && currentSong ? (
        <div className="guest-now-bar">
          <div className="guest-now-info">
            <span className="guest-now-label">{t('nowPlaying')}</span>
            <span className="guest-now-title">{currentSong.title}</span>
          </div>
          <div className="guest-now-right">
            {remaining != null && <span className="guest-now-timer">{formatTime(remaining)}</span>}
          </div>
        </div>
      ) : (
        <div className="guest-waiting">
          <span className="guest-waiting-icon">{t('musicIcon')}</span>
          <p>{t('ownerHasntStarted')}</p>
        </div>
      )}

      {queue.length > 0 && (
        <div className="guest-queue">
          {queue.map((song, index) => (
            <div key={song.id} className="guest-queue-item">
              <span className="guest-queue-pos">{index + 1}</span>
              {showThumbs && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="guest-queue-thumb" />}
              <span className="guest-queue-title">{song.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
