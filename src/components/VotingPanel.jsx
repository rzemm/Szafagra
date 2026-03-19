import { useMemo } from 'react'
import { ScrollText } from './ScrollText'

export function VotingPanel({ nextOptionKeys, nextOptions, nextVotesData, userId, onVote, showPlayNow = false, onPlayNow, onQueueSong, onRemoveOption, columns = false, onChooseOption, showThumbnails = true }) {
  const myVote = nextVotesData[userId] ?? null
  const countsByOption = useMemo(() => {
    const counts = Object.fromEntries(nextOptionKeys.map(key => [key, 0]))
    for (const vote of Object.values(nextVotesData)) {
      if (vote in counts) counts[vote] += 1
    }
    return counts
  }, [nextOptionKeys, nextVotesData])

  const maxOptVotes = useMemo(() => Math.max(0, ...Object.values(countsByOption)), [countsByOption])

  return (
    <div className="voting-card">
      <h2 className="section-title voting-title">Zagłosuj na następne piosenki</h2>
      <div className={`options-list${columns ? ' options-columns' : ''}`}>
        {nextOptionKeys.map(key => {
          const songs = nextOptions[key] ?? []
          const isVoted = myVote === key
          const voteCount = countsByOption[key] ?? 0
          const isWinning = voteCount > 0 && voteCount === maxOptVotes
          return (
            <div key={key} className={`vote-option${isVoted ? ' voted' : ''}${isWinning ? ' winning' : ''}`}>
              <div className="vote-option-header">
                <span className="vote-option-label">Opcja {parseInt(key) + 1}</span>
                {(() => { const total = Object.values(nextVotesData).length; const pct = total > 0 ? Math.round(voteCount / total * 100) : 0; return voteCount > 0 && <span className="vote-option-count">{pct}%</span> })()}
                <button className={`btn-vote-option${isVoted ? ' active' : ''}`} onClick={() => onVote(key)}>{isVoted ? '✓ Zagłosowano' : '▲ Głosuj'}</button>
                {onChooseOption && (
                  <button className="btn-choose-option" onClick={() => onChooseOption(key)}>★ Wybierz</button>
                )}
                {onRemoveOption && (
                  <button className="btn-remove-option" onClick={() => onRemoveOption(key)} title="Zastąp tę opcję innymi">↺</button>
                )}
              </div>
              <div className="option-songs">
                {songs.map((song, i) => (
                  <div key={song.id} className="option-song-item">
                    <span className="option-song-pos">{i + 1}</span>
                    {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="slot-thumb" />}
                    <ScrollText className="slot-title">{song.title}</ScrollText>
                    {showPlayNow && <button className="btn-icon play" onClick={() => onPlayNow(song)} title="Puść teraz">▶</button>}
                    {onQueueSong && <button className="btn-icon queue" onClick={() => onQueueSong(song)} title="Dodaj do kolejki">▤</button>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
