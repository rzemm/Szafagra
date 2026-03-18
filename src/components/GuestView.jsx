import { useMemo, useState } from 'react'
import { formatTime } from '../lib/jukebox'

export function GuestView({ isOwner, playerDivRef, isPlaying, currentSong, remaining, queue, nextOptionKeys, nextOptions, nextVotesData, userId, vote, skipThreshold, mySkipVote, voteSkip }) {
  const [queueOpen, setQueueOpen] = useState(false)

  const myVote = nextVotesData[userId] ?? null

  const countsByOption = useMemo(() => {
    const counts = Object.fromEntries(nextOptionKeys.map(k => [k, 0]))
    for (const v of Object.values(nextVotesData)) {
      if (v in counts) counts[v] += 1
    }
    return counts
  }, [nextOptionKeys, nextVotesData])

  const maxVotes = useMemo(() => Math.max(0, ...Object.values(countsByOption)), [countsByOption])

  return (
    <div className="guest-view">
      {isOwner && <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}><div ref={playerDivRef} /></div>}

      {isPlaying && currentSong && (
        <div className="guest-now-bar">
          <div className="guest-now-info">
            <span className="guest-now-label">TERAZ GRA</span>
            <span className="guest-now-title">{currentSong.title}</span>
          </div>
          <div className="guest-now-right">
            {remaining != null && <span className="guest-now-timer">{formatTime(remaining)}</span>}
            {queue.length > 0 && (
              <button className="guest-queue-toggle" onClick={() => setQueueOpen(o => !o)}>
                {queueOpen ? '▲' : '▼'} {queue.length}
              </button>
            )}
          </div>
        </div>
      )}

      {queueOpen && queue.length > 0 && (
        <div className="guest-queue">
          {queue.map((song, i) => (
            <div key={song.id} className="guest-queue-item">
              <span className="guest-queue-pos">{i + 1}</span>
              <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="guest-queue-thumb" />
              <span className="guest-queue-title">{song.title}</span>
            </div>
          ))}
        </div>
      )}

      {isPlaying && nextOptionKeys.length > 0 && (
        <div className="guest-voting">
          <p className="guest-voting-label">Zagłosuj na następne</p>
          {nextOptionKeys.map(key => {
            const songs = nextOptions[key] ?? []
            const isVoted = myVote === key
            const voteCount = countsByOption[key] ?? 0
            const isWinning = voteCount > 0 && voteCount === maxVotes
            return (
              <div key={key} className={`guest-vote-card${isVoted ? ' voted' : ''}${isWinning ? ' winning' : ''}`}>
                <div className="guest-vote-songs">
                  {songs.map(song => (
                    <div key={song.id} className="guest-vote-song">
                      <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="guest-vote-thumb" />
                      <span className="guest-vote-title">{song.title}</span>
                    </div>
                  ))}
                </div>
                <button className={`guest-vote-btn${isVoted ? ' active' : ''}`} onClick={() => vote(key)}>
                  <span>{isVoted ? '✓ Zagłosowano' : '▲ Głosuj'}</span>
                  {voteCount > 0 && <span className="guest-vote-count">{voteCount}</span>}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {isPlaying && skipThreshold > 0 && (
        <div className="guest-skip-row">
          <button className={`guest-skip-btn${mySkipVote ? ' active' : ''}`} onClick={voteSkip}>
            {mySkipVote ? '✓ Chcę pominąć tę piosenkę' : '⏭ Pomiń piosenkę'}
          </button>
        </div>
      )}

      {!isPlaying && (
        <div className="guest-waiting">
          <span className="guest-waiting-icon">🎵</span>
          <p>Właściciel pokoju jeszcze nie uruchomił jukeboxu…</p>
        </div>
      )}

      <div className="guest-footer">
        <button className="guest-footer-btn" disabled>☕ Postaw kawę</button>
        <button className="guest-footer-btn" disabled>✉ Napisz wiadomość</button>
      </div>
    </div>
  )
}
