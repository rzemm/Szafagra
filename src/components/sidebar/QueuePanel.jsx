import { ScrollText } from '../ScrollText'
import { useLanguage } from '../../context/LanguageContext'

const IconTrash = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)

export function QueuePanel({
  isPlaying,
  queue,
  voteThreshold,
  saveSettings,
  showThumbnails,
  canEditRoom,
  playSongNow,
  removeFromQueue,
}) {
  const { t } = useLanguage()

  return (
    <div className="section songs-section">
      <div className="sidebar-queue-header">
        <h2 className="section-title">{t('queueHeader')}</h2>
        <div className="sidebar-queue-threshold">
          <span className="panel-header-label">{t('minQueued')}</span>
          <div className="note-picker note-picker-sm">
            {[0, 1, 2, 3, 4].map((count) => (
              <button
                key={count}
                className={`note-btn${voteThreshold === count ? ' active' : ''}`}
                onClick={() => saveSettings('voteThreshold', count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
      </div>
      {isPlaying && queue.length > 0 ? (
        <ol className="queue-list">
          {queue.map((song, index) => (
            <li
              key={song.id}
              className={`queue-item${canEditRoom ? ' song-item-clickable' : ''}`}
              onClick={canEditRoom ? () => { playSongNow(song); removeFromQueue(song.id) } : undefined}
            >
              <span className="queue-pos">{index + 1}</span>
              {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-thumb" />}
              <ScrollText className="queue-title">{song.title}</ScrollText>
              {canEditRoom && <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); removeFromQueue(song.id) }} title={t('removeFromQueue')}><IconTrash /></button>}
            </li>
          ))}
        </ol>
      ) : (
        <p className="sidebar-queue-empty">{isPlaying ? t('queueEmpty') : t('playbackStopped')}</p>
      )}
    </div>
  )
}
