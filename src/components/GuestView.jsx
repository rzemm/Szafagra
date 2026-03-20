import { useMemo, useState } from 'react'
import { formatTime } from '../lib/jukebox'
import { extractYtId, fetchYtTitle } from '../lib/youtube'
import { useGuestPlayer } from '../hooks/useGuestPlayer'
import { ContactMessageForm } from './ContactMessageForm'
import { ScrollText } from './ScrollText'

export function GuestView({
  isOwner,
  playerDivRef,
  isPlaying,
  currentSong,
  remaining,
  queue,
  nextOptionKeys,
  nextOptions,
  nextVotesData,
  userId,
  vote,
  skipThreshold,
  mySkipVote,
  voteSkip,
  allowSuggestions,
  submitSuggestion,
  myRating,
  onRate,
  showThumbnails = true,
  jukeboxState,
  allowGuestListening = true,
  tickerText = '',
  tickerForGuests = false,
  onSubmitMessage,
}) {
  const { listening, toggleListening, playerDivRef: guestPlayerDivRef } = useGuestPlayer({ jukeboxState, isPlaying })
  const [queueOpen, setQueueOpen] = useState(false)
  const [hoverStar, setHoverStar] = useState(0)
  const [suggestUrl, setSuggestUrl] = useState('')
  const [suggestTitle, setSuggestTitle] = useState('')
  const [suggestErr, setSuggestErr] = useState('')
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSuggestBlur = async () => {
    const url = suggestUrl.trim()
    if (!url) return

    const ytId = extractYtId(url)
    if (!ytId) {
      setSuggestErr('Nieprawidlowy link YouTube')
      return
    }

    setSuggestErr('')
    setFetchingTitle(true)
    const title = await fetchYtTitle(url)
    setFetchingTitle(false)

    if (title) setSuggestTitle(title)
    else setSuggestErr('Nie udalo sie pobrac tytulu')
  }

  const handleSubmitSuggestion = async () => {
    const url = suggestUrl.trim()
    const ytId = extractYtId(url)
    if (!ytId || !suggestTitle) return

    setSubmitting(true)
    const ok = await submitSuggestion({ title: suggestTitle, ytId, url: `https://youtu.be/${ytId}` })
    setSubmitting(false)

    if (ok) {
      setSuggestUrl('')
      setSuggestTitle('')
      setSuggestErr('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  const myVote = nextVotesData[userId] ?? null

  const countsByOption = useMemo(() => {
    const counts = Object.fromEntries(nextOptionKeys.map((key) => [key, 0]))
    for (const value of Object.values(nextVotesData)) {
      if (value in counts) counts[value] += 1
    }
    return counts
  }, [nextOptionKeys, nextVotesData])

  const maxVotes = useMemo(() => Math.max(0, ...Object.values(countsByOption)), [countsByOption])

  return (
    <div className="guest-view">
      {tickerForGuests && tickerText && (
        <div className="ticker-bar">
          <span className="ticker-bar-inner">{tickerText}</span>
        </div>
      )}

      {isOwner && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
          <div ref={playerDivRef} />
        </div>
      )}

      {!isOwner && allowGuestListening && isPlaying && currentSong && (
        <div className="guest-player">
          <button className={`guest-player-toggle${listening ? ' active' : ''}`} onClick={toggleListening}>
            {listening ? 'Wylacz odsluch' : 'Sluchaj'}
          </button>
          {listening && (
            <div className="guest-player-yt">
              <div ref={guestPlayerDivRef} />
            </div>
          )}
        </div>
      )}

      {isPlaying && currentSong && (
        <div className="guest-now-bar">
          <div className="guest-now-info">
            <span className="guest-now-label">TERAZ GRA</span>
            <span className="guest-now-title">{currentSong.title}</span>
          </div>
          <div className="guest-now-right">
            {remaining != null && <span className="guest-now-timer">{formatTime(remaining)}</span>}
            {queue.length > 0 && (
              <button className="guest-queue-toggle" onClick={() => setQueueOpen((open) => !open)}>
                {queueOpen ? 'Ukryj' : 'Pokaz'} {queue.length}
              </button>
            )}
          </div>
        </div>
      )}

      {queueOpen && queue.length > 0 && (
        <div className="guest-queue">
          {queue.map((song, index) => (
            <div key={song.id} className="guest-queue-item">
              <span className="guest-queue-pos">{index + 1}</span>
              {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="guest-queue-thumb" />}
              <span className="guest-queue-title">{song.title}</span>
            </div>
          ))}
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
                      {showThumbnails && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="guest-vote-thumb" />}
                      <ScrollText className="guest-vote-title">{song.title}</ScrollText>
                    </div>
                  ))}
                </div>
                <div className={`guest-vote-btn${isVoted ? ' active' : ''}`}>
                  <span>{isVoted ? 'Zaglosowano' : 'Glosuj'}</span>
                  {voteCount > 0 && <span className="guest-vote-count">{voteCount}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isPlaying && skipThreshold > 0 && (
        <div className="guest-skip-row">
          <button className={`guest-skip-btn${mySkipVote ? ' active' : ''}`} onClick={voteSkip}>
            {mySkipVote ? 'Chce pominac te piosenke' : 'Pomin piosenke'}
          </button>
        </div>
      )}

      {!isPlaying && (
        <div className="guest-waiting">
          <span className="guest-waiting-icon">Muzyka</span>
          <p>Wlasciciel pokoju jeszcze nie uruchomil jukeboxu...</p>
        </div>
      )}

      {isPlaying && userId && (
        <div className="guest-rating">
          <p className="guest-rating-label">{myRating > 0 ? 'Twoja ocena' : 'Ocen te playliste'}</p>
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
                *
              </button>
            ))}
          </div>
          {myRating > 0 && <span className="guest-rating-value">{myRating}/5</span>}
        </div>
      )}

      {allowSuggestions && (
        <div className="guest-suggest">
          <p className="guest-suggest-label">Zaproponuj utwor</p>
          {submitted ? (
            <p className="guest-suggest-ok">Propozycja wyslana!</p>
          ) : (
            <>
              <input
                className="guest-suggest-input"
                value={suggestUrl}
                onChange={(event) => {
                  setSuggestUrl(event.target.value)
                  setSuggestTitle('')
                  setSuggestErr('')
                }}
                onBlur={handleSuggestBlur}
                placeholder="Link YouTube..."
              />
              {fetchingTitle && <p className="guest-suggest-hint">Pobieranie tytulu...</p>}
              {suggestTitle && <p className="guest-suggest-hint">{suggestTitle}</p>}
              {suggestErr && <p className="guest-suggest-err">{suggestErr}</p>}
              <button
                className="guest-suggest-btn"
                onClick={handleSubmitSuggestion}
                disabled={!suggestTitle || submitting}
              >
                {submitting ? '...' : '+ Zaproponuj'}
              </button>
            </>
          )}
        </div>
      )}

      <div className="guest-footer">
        <a className="guest-footer-btn" href="https://buycoffee.to/szafifi" target="_blank" rel="noreferrer">Postaw kawe</a>
        <ContactMessageForm
          triggerClassName="guest-footer-btn guest-footer-btn--active"
          triggerLabel="Napisz wiadomosc"
          title="Napisz wiadomosc do tworcow"
          description="Mozesz zglosic blad, pomysl albo szybki feedback dotyczacy tego pokoju."
          successMessage="Dzieki, wiadomosc zostala zapisana."
          submitLabel="Wyslij"
          panelClassName="guest-contact-form"
          onSubmit={(payload) => onSubmitMessage({ ...payload, source: 'guest_room', roomId: jukeboxState?.id ?? null })}
        />
      </div>
    </div>
  )
}
