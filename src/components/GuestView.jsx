import { useEffect, useMemo, useState } from 'react'

const IconStar = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
)
import { formatTime } from '../lib/jukebox'
import { extractYtId, fetchYtTitle, fetchUserYtPlaylists, fetchYtPlaylistItems, searchYouTube } from '../lib/youtube'
import { useGuestPlayer } from '../hooks/useGuestPlayer'
import { useYouTubeAuth } from '../hooks/useYouTubeAuth'
import { ContactMessageForm } from './ContactMessageForm'
import { ScrollText } from './ScrollText'
import { YouTubeAuthNotice } from './YouTubeAuthNotice'
import { useLanguage } from '../context/LanguageContext'

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
  submitPlaylistSuggestion,
  myRating,
  onRate,
  showThumbnails = true,
  jukeboxState,
  allowGuestListening = true,
  tickerText = '',
  tickerForGuests = false,
  onSubmitMessage,
}) {
  const { t } = useLanguage()
  const { listening, toggleListening, playerDivRef: guestPlayerDivRef } = useGuestPlayer({ jukeboxState, isPlaying })
  const ytAuth = useYouTubeAuth()
  const [queueOpen, setQueueOpen] = useState(false)
  const [hoverStar, setHoverStar] = useState(0)
  const [suggestUrl, setSuggestUrl] = useState('')
  const [suggestTitle, setSuggestTitle] = useState('')
  const [suggestErr, setSuggestErr] = useState('')
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [suggestSearchResults, setSuggestSearchResults] = useState([])

  // playlist suggestion state
  const [playlists, setPlaylists] = useState(null)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistSongs, setPlaylistSongs] = useState(null)
  const [loadingPlaylistSongs, setLoadingPlaylistSongs] = useState(false)
  const [submittingPlaylist, setSubmittingPlaylist] = useState(false)
  const [submittedPlaylist, setSubmittedPlaylist] = useState(false)

  useEffect(() => {
    const isUrl = suggestUrl.includes('youtube.com') || suggestUrl.includes('youtu.be')
    if (isUrl || suggestUrl.trim().length < 3) {
      setSuggestSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchYouTube(suggestUrl.trim(), 5)
        setSuggestSearchResults(results)
      } catch {
        setSuggestSearchResults([])
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [suggestUrl])

  const handleSuggestBlur = async () => {
    const url = suggestUrl.trim()
    if (!url) return

    const ytId = extractYtId(url)
    if (!ytId) {
      setSuggestErr(t('invalidYouTubeLink'))
      return
    }

    setSuggestErr('')
    setFetchingTitle(true)
    const title = await fetchYtTitle(url)
    setFetchingTitle(false)

    if (title) setSuggestTitle(title)
    else setSuggestErr(t('couldNotFetchTitle'))
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

  const handleSelectSuggestion = async (suggestion) => {
    setSuggestSearchResults([])
    setSubmitting(true)
    const ok = await submitSuggestion({ title: suggestion.title, ytId: suggestion.ytId, url: `https://youtu.be/${suggestion.ytId}` })
    setSubmitting(false)
    if (ok) {
      setSuggestUrl('')
      setSuggestTitle('')
      setSuggestErr('')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  useEffect(() => {
    if (!ytAuth.accessToken) return
    setPlaylists(null)
    setSelectedPlaylist(null)
    setPlaylistSongs(null)
    setLoadingPlaylists(true)
    fetchUserYtPlaylists(ytAuth.accessToken)
      .then((data) => { setPlaylists(data); setLoadingPlaylists(false) })
      .catch(() => setLoadingPlaylists(false))
  }, [ytAuth.accessToken])

  const handleSelectPlaylist = async (playlist) => {
    setSelectedPlaylist(playlist)
    setPlaylistSongs(null)
    setLoadingPlaylistSongs(true)
    try {
      const items = await fetchYtPlaylistItems(playlist.id, ytAuth.accessToken)
      setPlaylistSongs(items)
    } catch {
      setPlaylistSongs([])
    } finally {
      setLoadingPlaylistSongs(false)
    }
  }

  const handleSubmitPlaylist = async () => {
    if (!selectedPlaylist || !playlistSongs || submittingPlaylist) return
    setSubmittingPlaylist(true)
    const ok = await submitPlaylistSuggestion({
      playlistTitle: selectedPlaylist.title,
      playlistId: selectedPlaylist.id,
      songs: playlistSongs,
    })
    setSubmittingPlaylist(false)
    if (ok) {
      setSubmittedPlaylist(true)
      setSelectedPlaylist(null)
      setPlaylistSongs(null)
      setTimeout(() => setSubmittedPlaylist(false), 4000)
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
            {listening ? t('disableListening') : t('listen')}
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
            <span className="guest-now-label">{t('nowPlaying')}</span>
            <span className="guest-now-title">{currentSong.title}</span>
          </div>
          <div className="guest-now-right">
            {remaining != null && <span className="guest-now-timer">{formatTime(remaining)}</span>}
            {queue.length > 0 && (
              <button className="guest-queue-toggle" onClick={() => setQueueOpen((open) => !open)}>
                {queueOpen ? t('hide') : t('show')} {queue.length}
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
                  <span>{isVoted ? t('voted') : t('vote')}</span>
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
            {mySkipVote ? t('wantToSkip') : t('skipSong')}
          </button>
        </div>
      )}

      {!isPlaying && (
        <div className="guest-waiting">
          <span className="guest-waiting-icon">{t('musicIcon')}</span>
          <p>{t('ownerHasntStarted')}</p>
        </div>
      )}

      {isPlaying && userId && (
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
      )}

      {allowSuggestions && (
        <div className="guest-suggest">
          <p className="guest-suggest-label">{t('suggestSong')}</p>
          {submitted ? (
            <p className="guest-suggest-ok">{t('suggestionSent')}</p>
          ) : (
            <>
              <div className="song-input-wrapper">
                <input
                  className="guest-suggest-input"
                  value={suggestUrl}
                  onChange={(event) => {
                    setSuggestUrl(event.target.value)
                    setSuggestTitle('')
                    setSuggestErr('')
                  }}
                  onBlur={handleSuggestBlur}
                  onKeyDown={(event) => { if (event.key === 'Escape') setSuggestSearchResults([]) }}
                  placeholder={t('suggestPlaceholder')}
                />
                {suggestSearchResults.length > 0 && (
                  <ul className="song-suggestions-dropdown">
                    {suggestSearchResults.map((s) => (
                      <li
                        key={s.ytId}
                        className="song-suggestion-item"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        {s.thumbnail && <img src={s.thumbnail} className="suggestion-thumb" alt="" />}
                        <ScrollText className="suggestion-title">{s.title}</ScrollText>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {fetchingTitle && <p className="guest-suggest-hint">{t('fetchingTitleShort')}</p>}
              {suggestTitle && <p className="guest-suggest-hint">{suggestTitle}</p>}
              {suggestErr && <p className="guest-suggest-err">{suggestErr}</p>}
              <button
                className="guest-suggest-btn"
                onClick={handleSubmitSuggestion}
                disabled={!suggestTitle || submitting}
              >
                {submitting ? '...' : t('suggestBtn')}
              </button>
            </>
          )}
        </div>
      )}

      {allowSuggestions && submitPlaylistSuggestion && (
        <div className="guest-suggest">
          <p className="guest-suggest-label">{t('suggestPlaylist')}</p>
          {submittedPlaylist ? (
            <p className="guest-suggest-ok">{t('suggestPlaylistSent')}</p>
          ) : !ytAuth.accessToken ? (
            <>
              <p className="guest-suggest-playlist-desc">{t('suggestPlaylistDesc')}</p>
              <button className="guest-suggest-yt-btn" onClick={ytAuth.connect} disabled={ytAuth.connecting}>
                {ytAuth.connecting ? t('suggestPlaylistConnecting') : t('suggestPlaylistConnect')}
              </button>
              {ytAuth.error && <p className="guest-suggest-err">{ytAuth.error}</p>}
              <YouTubeAuthNotice helpText={ytAuth.helpText} className="guest-suggest-hint guest-suggest-hint--stacked" />
            </>
          ) : (
            <>
              <div className="guest-suggest-yt-header">
                <button className="guest-suggest-yt-disconnect" onClick={ytAuth.disconnect}>{t('suggestPlaylistDisconnect')}</button>
              </div>
              {loadingPlaylists && <p className="guest-suggest-hint">{t('suggestPlaylistLoading')}</p>}
              {!loadingPlaylists && playlists && playlists.length === 0 && (
                <p className="guest-suggest-hint">{t('suggestPlaylistNoPlaylists')}</p>
              )}
              {!selectedPlaylist && playlists && playlists.length > 0 && (
                <>
                  <p className="guest-suggest-hint">{t('suggestPlaylistSelect')}</p>
                  <ul className="guest-playlist-list">
                    {playlists.map((pl) => (
                      <li key={pl.id} className="guest-playlist-item" onClick={() => handleSelectPlaylist(pl)}>
                        {pl.thumbnail && <img src={pl.thumbnail} alt="" className="guest-playlist-thumb" />}
                        <div className="guest-playlist-info">
                          <span className="guest-playlist-title">{pl.title}</span>
                          <span className="guest-playlist-count">{pl.itemCount} {t('suggestPlaylistVideos')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {selectedPlaylist && (
                <div className="guest-playlist-selected">
                  <button className="guest-playlist-back" onClick={() => { setSelectedPlaylist(null); setPlaylistSongs(null) }}>
                    ← {t('suggestPlaylistBack')}
                  </button>
                  <div className="guest-playlist-selected-info">
                    {selectedPlaylist.thumbnail && <img src={selectedPlaylist.thumbnail} alt="" className="guest-playlist-thumb" />}
                    <div>
                      <span className="guest-playlist-title">{selectedPlaylist.title}</span>
                      {loadingPlaylistSongs && <p className="guest-suggest-hint">{t('suggestPlaylistFetching')}</p>}
                      {playlistSongs && <p className="guest-suggest-hint">{t('suggestPlaylistSongCount', playlistSongs.length)}</p>}
                    </div>
                  </div>
                  {playlistSongs && playlistSongs.length > 0 && (
                    <button
                      className="guest-suggest-btn"
                      onClick={handleSubmitPlaylist}
                      disabled={submittingPlaylist}
                    >
                      {submittingPlaylist ? '...' : t('suggestPlaylistSubmit')}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="guest-footer">
        <a className="guest-footer-btn" href="https://buycoffee.to/szafifi" target="_blank" rel="noreferrer">{t('buyCoffeeLink')}</a>
        <ContactMessageForm
          triggerClassName="guest-footer-btn guest-footer-btn--active"
          triggerLabel={t('writeMessage')}
          title={t('writeMessageToCreators')}
          description={t('reportBugOrIdea')}
          successMessage={t('thanksSaved')}
          submitLabel={t('send')}
          panelClassName="guest-contact-form"
          onSubmit={(payload) => onSubmitMessage({ ...payload, source: 'guest_room', roomId: jukeboxState?.id ?? null })}
        />
      </div>
    </div>
  )
}
