import { useEffect, useMemo, useRef, useState } from 'react'

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

const ALL_TABS = ['voting', 'queue', 'suggest', 'list']

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
  allowSuggestFromList,
  submitSuggestion,
  submitVotingProposal,
  submitPlaylistSuggestion,
  myRating,
  onRate,
  // showThumbnails prop from admin is intentionally ignored — guest controls their own preference
  jukeboxState,
  allowGuestListening = true,
  tickerText = '',
  tickerForGuests = false,
  onSubmitMessage,
  onOpenCookieSettings,
}) {
  const { t, toggleLang } = useLanguage()
  const { listening, toggleListening, playerDivRef: guestPlayerDivRef } = useGuestPlayer({ jukeboxState, isPlaying })
  const ytAuth = useYouTubeAuth()
  const [hoverStar, setHoverStar] = useState(0)
  const [suggestUrl, setSuggestUrl] = useState('')
  const [suggestTitle, setSuggestTitle] = useState('')
  const [suggestErr, setSuggestErr] = useState('')
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [suggestSearchResults, setSuggestSearchResults] = useState([])
  const [listSearch, setListSearch] = useState('')
  const [showThumbs, setShowThumbs] = useState(true)

  // playlist suggestion state
  const [playlists, setPlaylists] = useState(null)
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistSongs, setPlaylistSongs] = useState(null)
  const [loadingPlaylistSongs, setLoadingPlaylistSongs] = useState(false)
  const [submittingPlaylist, setSubmittingPlaylist] = useState(false)
  const [submittedPlaylist, setSubmittedPlaylist] = useState(false)

  // tabs
  const visibleTabs = useMemo(() => {
    if (!allowSuggestions) return ['voting', 'queue', 'list']
    return ALL_TABS
  }, [allowSuggestions])

  const [activeTab, setActiveTab] = useState('voting')

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) setActiveTab(visibleTabs[0])
  }, [visibleTabs, activeTab])

  const activeIndex = visibleTabs.indexOf(activeTab)
  const sliderIndex = ALL_TABS.indexOf(activeTab)

  // swipe
  const swipeStart = useRef(null)

  const handlePointerDown = (e) => {
    if (e.target.closest('button, input, select, a, label, [role="button"], ul, li')) return
    swipeStart.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e) => {
    if (!swipeStart.current) return
    const dx = e.clientX - swipeStart.current.x
    const dy = Math.abs(e.clientY - swipeStart.current.y)
    swipeStart.current = null
    if (Math.abs(dx) < 40 || Math.abs(dx) < dy) return
    const idx = visibleTabs.indexOf(activeTab)
    if (dx < 0 && idx < visibleTabs.length - 1) setActiveTab(visibleTabs[idx + 1])
    else if (dx > 0 && idx > 0) setActiveTab(visibleTabs[idx - 1])
  }

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
    if (!ytId) { setSuggestErr(t('invalidYouTubeLink')); return }
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

  const myProposal = userId ? (jukeboxState?.votingProposals?.[userId] ?? null) : null
  const myProposedIds = useMemo(() => {
    if (!userId || !jukeboxState?.votingProposals) return new Set()
    return new Set(
      Object.entries(jukeboxState.votingProposals)
        .filter(([key]) => key === userId || key.startsWith(`${userId}_`))
        .map(([, song]) => song.id)
    )
  }, [userId, jukeboxState?.votingProposals])

  const handleSuggestFromList = async (song) => {
    if (!submitVotingProposal) return
    const key = allowSuggestFromList === true ? `${userId}_${song.id}` : undefined
    await submitVotingProposal(song, key)
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

  const allSongs = useMemo(() => {
    const songs = jukeboxState?.songs ?? []
    const indexed = songs.map((s, i) => ({ song: s, origIdx: i }))
    if (!listSearch.trim()) return indexed
    const q = listSearch.trim().toLowerCase()
    return indexed.filter(({ song }) => song.title?.toLowerCase().includes(q))
  }, [jukeboxState?.songs, listSearch])

  const tabLabels = {
    voting: t('tabVoting'),
    queue: t('tabQueue'),
    suggest: t('tabSuggest'),
    list: t('tabList'),
  }

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

      {/* Tab navigation */}
      <div className="guest-tab-nav">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            className={`guest-tab-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Slider wrapper */}
      <div
        className="guest-tab-slider-wrap"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className="guest-tab-slider"
          style={{ transform: `translateX(-${sliderIndex * 100}%)` }}
        >
          {/* ── Panel: Głosuj ── */}
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
          </div>

          {/* ── Panel: Kolejka ── */}
          <div className="guest-tab-panel">
            {isPlaying && skipThreshold > 0 && (
              <div className="guest-skip-row guest-skip-row--top">
                <button className={`guest-skip-btn${mySkipVote ? ' active' : ''}`} onClick={voteSkip}>
                  {mySkipVote ? t('wantToSkip') : t('skipCurrent')}
                </button>
              </div>
            )}

            {isPlaying && currentSong ? (
              <div className="guest-now-bar">
                <div className="guest-now-info">
                  <span className="guest-now-label">{t('nowPlaying')}</span>
                  <span className="guest-now-title">{currentSong.title}</span>
                </div>
                <div className="guest-now-right">
                  {remaining != null && <span className="guest-now-timer">{formatTime(remaining)}</span>}
                </div>
              </div>
            ) : (
              <div className="guest-waiting">
                <span className="guest-waiting-icon">{t('musicIcon')}</span>
                <p>{t('ownerHasntStarted')}</p>
              </div>
            )}

            {queue.length > 0 && (
              <div className="guest-queue">
                {queue.map((song, index) => (
                  <div key={song.id} className="guest-queue-item">
                    <span className="guest-queue-pos">{index + 1}</span>
                    {showThumbs && <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="guest-queue-thumb" />}
                    <span className="guest-queue-title">{song.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Panel: Zaproponuj (only rendered when allowSuggestions) ── */}
          {allowSuggestions ? (
            <div className="guest-tab-panel">
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

              {submitPlaylistSuggestion && (
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
                            <button className="guest-suggest-btn" onClick={handleSubmitPlaylist} disabled={submittingPlaylist}>
                              {submittingPlaylist ? '...' : t('suggestPlaylistSubmit')}
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="guest-tab-panel" />
          )}

          {/* ── Panel: Lista ── */}
          <div className="guest-tab-panel">
            <div className="guest-list">
              <div className="guest-list-search-row">
                <input
                  className="guest-list-search"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder={t('listSearchPlaceholder')}
                />
                {listSearch && (
                  <button className="guest-list-search-clear" onClick={() => setListSearch('')}>✕</button>
                )}
              </div>
              {allSongs.length === 0 ? (
                <p className="guest-list-empty">{t('listEmpty')}</p>
              ) : (
                <>
                  <p className="guest-list-count">{t('listCount', allSongs.length)}</p>
                  <ul className="guest-list-songs">
                    {allSongs.map(({ song }) => {
                      const isMyProposal = allowSuggestFromList === true
                        ? myProposedIds.has(song.id)
                        : myProposal?.id === song.id
                      const showBtn = allowSuggestFromList && submitVotingProposal &&
                        (allowSuggestFromList === true || !myProposal || isMyProposal)
                      return (
                        <li key={song.id} className={`guest-list-song${isMyProposal ? ' proposed' : ''}`}>
                          {showThumbs && (
                            <img
                              src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`}
                              alt=""
                              className="guest-list-thumb"
                            />
                          )}
                          <span className="guest-list-title">{song.title}</span>
                          {showBtn && (
                            <button
                              className={`guest-list-suggest-btn${isMyProposal ? ' sent' : ''}`}
                              onClick={() => !isMyProposal && handleSuggestFromList(song)}
                              title={isMyProposal ? t('myProposal') : t('proposeForVote')}
                            >
                              {isMyProposal ? '✓' : '+'}
                            </button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="guest-footer">
        <div className="guest-footer-row">
          <button
            className={`guest-footer-btn guest-footer-btn--active${showThumbs ? ' active' : ''}`}
            onClick={() => setShowThumbs((v) => !v)}
          >
            {t('thumbnails')}
          </button>
          <button className="lang-toggle" onClick={toggleLang}>{t('langToggle')}</button>
          {onOpenCookieSettings && (
            <button className="header-utility-link" onClick={onOpenCookieSettings}>{t('cookies')}</button>
          )}
        </div>
        <div className="guest-footer-row">
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
    </div>
  )
}
