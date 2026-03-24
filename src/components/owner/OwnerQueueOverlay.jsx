import { ScrollText } from '../ScrollText'

export function OwnerQueueOverlay({ isOpen, queue, canEditRoom, playback, voting, t }) {
  if (!isOpen) return null

  return (
    <div className="queue-overlay" onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()}>
      {queue.length > 0 ? (
        <ol className="queue-overlay-list">
          {queue.map((song) => (
            <div
              key={song.id}
              className={`queue-overlay-item${canEditRoom ? ' queue-overlay-item--clickable' : ''}`}
              onClick={canEditRoom ? () => { voting.playSongNow(song); playback.removeFromQueue(song.id) } : undefined}
            >
              <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-overlay-thumb" />
              <ScrollText className="queue-overlay-title">{song.title}</ScrollText>
              {canEditRoom && (
                <button
                  className="queue-overlay-delete"
                  onClick={(event) => { event.stopPropagation(); playback.removeFromQueue(song.id) }}
                  title={t('removeFromQueue')}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </ol>
      ) : (
        <p className="queue-overlay-empty">{playback.isPlaying ? t('queueEmpty') : t('playbackStopped')}</p>
      )}
    </div>
  )
}
