import { formatTime } from '../lib/jukebox'
import { VotingPanel } from './VotingPanel'

export function GuestView({ isOwner, playerDivRef, isPlaying, currentSong, remaining, queue, nextOptionKeys, nextOptions, nextVotesData, userId, vote, skipThreshold, mySkipVote, voteSkip }) {
  return (
    <>
      {isOwner && <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}><div ref={playerDivRef} /></div>}
      {isPlaying && currentSong && <div className="now-playing-guest"><span className="now-label">Teraz gra</span><span className="now-title">{currentSong.title}</span>{remaining != null && <span className="now-timer">{formatTime(remaining)}</span>}</div>}
      {isPlaying && queue.length > 0 && (
        <div className="voting-card"><h2 className="section-title voting-title">Zaraz zagra</h2><ol className="queue-list">{queue.map((song, i) => <li key={song.id} className="queue-item"><span className="queue-pos">{i + 1}</span><img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-thumb" /><span className="queue-title">{song.title}</span></li>)}</ol></div>
      )}
      {isPlaying && nextOptionKeys.length > 0 && (
        <VotingPanel nextOptionKeys={nextOptionKeys} nextOptions={nextOptions} nextVotesData={nextVotesData} userId={userId} onVote={vote} />
      )}
      {isPlaying && skipThreshold > 0 && <div className="skip-card"><button className={`btn-skip${mySkipVote ? ' active' : ''}`} onClick={voteSkip}>{mySkipVote ? '✓ Chcę pominąć' : '⏭ Pomiń piosenkę'}</button></div>}
      {!isPlaying && <div className="voting-card"><p className="empty-hint">Właściciel pokoju jeszcze nie uruchomił jukeboxu…</p></div>}
    </>
  )
}
