export function VotingPanel({ nextOptionKeys, nextOptions, nextVotesData, userId, onVote, showPlayNow = false, onPlayNow }) {
  return (
    <div className="voting-card">
      <h2 className="section-title voting-title">Zagłosuj na następne piosenki</h2>
      <div className="options-list">
        {nextOptionKeys.map(key => {
          const songs = nextOptions[key] ?? []
          const myVote = nextVotesData[userId] ?? null
          const isVoted = myVote === key
          const voteCount = Object.values(nextVotesData).filter(v => v === key).length
          const maxOptVotes = Math.max(0, ...nextOptionKeys.map(k => Object.values(nextVotesData).filter(v => v === k).length))
          const isWinning = voteCount > 0 && voteCount === maxOptVotes
          return (
            <div key={key} className={`vote-option${isVoted ? ' voted' : ''}${isWinning ? ' winning' : ''}`}>
              <div className="vote-option-header">
                <span className="vote-option-label">Opcja {parseInt(key) + 1}</span>
                {voteCount > 0 && <span className="vote-option-count">{voteCount} głos{voteCount === 1 ? '' : voteCount < 5 ? 'y' : 'ów'}</span>}
                <button className={`btn-vote-option${isVoted ? ' active' : ''}`} onClick={() => onVote(key)}>{isVoted ? '✓ Zagłosowano' : '▲ Głosuj'}</button>
              </div>
              <div className="option-songs">
                {songs.map((song, i) => (
                  <div key={song.id} className="option-song-item">
                    <span className="option-song-pos">{i + 1}</span>
                    <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="slot-thumb" />
                    <span className="slot-title">{song.title}</span>
                    {showPlayNow && <button className="btn-icon play" onClick={() => onPlayNow(song)} title="Puść teraz">▶</button>}
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
