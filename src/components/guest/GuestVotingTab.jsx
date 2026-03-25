import { ScrollText } from '../ScrollText'

const IconStar = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
)

const VOTES_NEEDED = 5

export function GuestVotingTab({
  isPlaying,
  nextOptionKeys,
  nextOptions,
  myVote,
  countsByOption,
  maxVotes,
  vote,
  showThumbs,
  isLoggedIn,
  voteCount,
  myRating,
  hoverStar,
  setHoverStar,
  onRate,
  t,
}) {
  return (
    <div className="guest-tab-panel">
      {!isPlaying && (
        <div className="guest-waiting">
          <span className="guest-waiting-icon">{t('musicIcon')}</span>
          <p>{t('ownerHasntStarted')}</p>
        </div>
      )}

      {isPlaying && nextOptionKeys.length > 0 && (
        <div className="guest-voting">
          {nextOptionKeys.map((key) => {
            const songs = nextOptions[key] ?? []
            const isVoted = myVote === key
            const voteCount = countsByOption[key] ?? 0
            const isWinning = voteCount > 0 && voteCount === maxVotes

            return (
              <div key={key} className={`guest-vote-card${isVoted ? ' voted' : ''}${isWinning ? ' winning' : ''}`} onClick={() => vote(key)}>
                <div className="guest-vote-songs">
                  {songs.map((song) => (
                    <div key={song.id} className="guest-vote-song">
                      {showThumbs && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="guest-vote-thumb" />}
                      <ScrollText className="guest-vote-title">{song.title}</ScrollText>
                    </div>
                  ))}
                </div>
                <div className={`guest-vote-btn${isVoted ? ' active' : ''}`}>
                  <span>{isVoted ? t('voted') : t('vote')}</span>
                  {voteCount > 0 && <span className="guest-vote-count">{voteCount}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isPlaying && (
        isLoggedIn && voteCount >= VOTES_NEEDED ? (
          <div className="guest-rating">
            <p className="guest-rating-label">{myRating > 0 ? t('yourRating') : t('ratePlaylist')}</p>
            <div className="guest-rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`rating-star${(hoverStar ? hoverStar >= star : myRating >= star) ? ' active' : ''}`}
                  onClick={() => onRate(myRating === star ? 0 : star)}
                  onMouseEnter={() => setHoverStar(star)}
                  onMouseLeave={() => setHoverStar(0)}
                  title={`${star}/5`}
                >
                  <IconStar />
                </button>
              ))}
            </div>
            {myRating > 0 && <span className="guest-rating-value">{myRating}/5</span>}
          </div>
        ) : (
          <p className="guest-rating-hint">
            {!isLoggedIn ? t('ratingLoggedInOnly') : t('ratingVotesLeft', VOTES_NEEDED - voteCount)}
          </p>
        )
      )}
    </div>
  )
}
