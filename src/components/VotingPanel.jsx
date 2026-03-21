import { useMemo } from 'react'
import { ScrollText } from './ScrollText'

export function VotingPanel({ nextOptionKeys, nextOptions, nextVotesData, onPlayNow, onQueueSong, onRemoveOption, columns = false, onChooseOption, showThumbnails = true }) {
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
      <div className={`options-list${columns ? ' options-columns' : ''}`}>
        {nextOptionKeys.map(key => {
          const songs = nextOptions[key] ?? []
          const voteCount = countsByOption[key] ?? 0
          const isWinning = voteCount > 0 && voteCount === maxOptVotes
          return (
            <div key={key} className={`vote-option${isWinning ? ' winning' : ''}`}>
              <div className="vote-option-header">
                {onChooseOption && (
                  <button className="btn-choose-option" onClick={() => onChooseOption(key)} title="Wybierz tę opcję">★</button>
                )}
                {onRemoveOption && (
                  <button className="btn-remove-option" onClick={() => onRemoveOption(key)} title="Wylosuj nową opcję">↺</button>
                )}
              </div>
              <div className="option-songs">
                {songs.map((song, i) => (
                  <div key={song.id} className="option-song-item">
                    <span className="option-song-pos">{i + 1}</span>
                    {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="slot-thumb" />}
                    <ScrollText className="slot-title">{song.title}</ScrollText>
                    {onPlayNow && <button className="btn-icon play" onClick={() => onPlayNow(song)} title="Puść teraz">▶</button>}
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
