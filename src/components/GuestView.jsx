import { useMemo, useRef, useState } from 'react'
import { useGuestPlaylistSuggestion } from '../hooks/useGuestPlaylistSuggestion'
import { useGuestSongSuggestion } from '../hooks/useGuestSongSuggestion'
import { useYouTubeAuth } from '../hooks/useYouTubeAuth'
import { ContactMessageForm } from './ContactMessageForm'
import { GuestEventTab } from './guest/GuestEventTab'
import { GuestListTab } from './guest/GuestListTab'
import { GuestQueueTab } from './guest/GuestQueueTab'
import { GuestSuggestTab } from './guest/GuestSuggestTab'
import { GuestVotingTab } from './guest/GuestVotingTab'
import { useLanguage } from '../context/useLanguage'

const ALL_TABS = ['voting', 'suggest', 'queue', 'list', 'event']

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
  jukeboxState,
  tickerText = '',
  tickerForGuests = false,
  onSubmitMessage,
  onOpenCookieSettings,
}) {
  const { t, lang, toggleLang } = useLanguage()
  const ytAuth = useYouTubeAuth()
  const suggestion = useGuestSongSuggestion({ submitSuggestion, t })
  const playlist = useGuestPlaylistSuggestion({
    ytAccessToken: ytAuth.accessToken,
    submitPlaylistSuggestion,
  })
  const [hoverStar, setHoverStar] = useState(0)
  const [listSearch, setListSearch] = useState('')
  const [showThumbs, setShowThumbs] = useState(true)

  const hasEvent = !!(jukeboxState?.settings?.partyDate)
  const visibleTabs = useMemo(() => {
    const tabs = allowSuggestions
      ? ['voting', 'suggest', 'queue', 'list']
      : ['voting', 'queue', 'list']
    if (hasEvent) tabs.push('event')
    return tabs
  }, [allowSuggestions, hasEvent])

  const [activeTab, setActiveTab] = useState('voting')
  const currentTab = visibleTabs.includes(activeTab) ? activeTab : visibleTabs[0]
  const sliderIndex = ALL_TABS.indexOf(currentTab)
  const swipeStart = useRef(null)

  const handlePointerDown = (event) => {
    if (event.target.closest('button, input, select, a, label, [role="button"], ul, li')) return
    swipeStart.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event) => {
    if (!swipeStart.current) return
    const dx = event.clientX - swipeStart.current.x
    const dy = Math.abs(event.clientY - swipeStart.current.y)
    swipeStart.current = null
    if (Math.abs(dx) < 40 || Math.abs(dx) < dy) return
    const index = visibleTabs.indexOf(currentTab)
    if (dx < 0 && index < visibleTabs.length - 1) setActiveTab(visibleTabs[index + 1])
    else if (dx > 0 && index > 0) setActiveTab(visibleTabs[index - 1])
  }

  const votingProposals = jukeboxState?.votingProposals
  const myProposal = userId ? (votingProposals?.[userId] ?? null) : null
  const myProposedIds = useMemo(() => {
    if (!userId || !votingProposals) return new Set()
    return new Set(
      Object.entries(votingProposals)
        .filter(([key]) => key === userId || key.startsWith(`${userId}_`))
        .map(([, song]) => song.id)
    )
  }, [userId, votingProposals])

  const handleSuggestFromList = async (song) => {
    if (!submitVotingProposal) return
    const key = allowSuggestFromList === true ? `${userId}_${song.id}` : undefined
    await submitVotingProposal(song, key)
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
    const indexed = songs.map((song) => ({ song }))
    if (!listSearch.trim()) return indexed
    const query = listSearch.trim().toLowerCase()
    return indexed.filter(({ song }) => song.title?.toLowerCase().includes(query))
  }, [jukeboxState?.songs, listSearch])

  const tabLabels = {
    voting: t('tabVoting'),
    suggest: t('tabSuggest'),
    queue: t('tabQueue'),
    list: t('tabList'),
    event: t('tabEvent'),
  }

  const tabEmoji = {
    voting: '🗳️',
    suggest: '➕',
    queue: '▶️',
    list: '🎵',
    event: '📅',
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

      <div className="guest-tab-nav">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            className={`guest-tab-btn${currentTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
            title={tabLabels[tab]}
          >
            {tabEmoji[tab]}
          </button>
        ))}
      </div>
      <div className="guest-tab-nav-title">{tabLabels[currentTab]}</div>

      <div
        className="guest-tab-slider-wrap"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div
          className="guest-tab-slider"
          style={{ transform: `translateX(-${sliderIndex * 100}%)` }}
        >
          <GuestVotingTab
            isPlaying={isPlaying}
            nextOptionKeys={nextOptionKeys}
            nextOptions={nextOptions}
            myVote={myVote}
            countsByOption={countsByOption}
            maxVotes={maxVotes}
            vote={vote}
            showThumbs={showThumbs}
            userId={userId}
            myRating={myRating}
            hoverStar={hoverStar}
            setHoverStar={setHoverStar}
            onRate={onRate}
            t={t}
          />

          <GuestSuggestTab
            allowSuggestions={allowSuggestions}
            allowSuggestFromList={allowSuggestFromList}
            submitPlaylistSuggestion={submitPlaylistSuggestion}
            suggestion={suggestion}
            playlist={playlist}
            ytAuth={ytAuth}
            t={t}
          />

          <GuestQueueTab
            isPlaying={isPlaying}
            skipThreshold={skipThreshold}
            mySkipVote={mySkipVote}
            voteSkip={voteSkip}
            currentSong={currentSong}
            remaining={remaining}
            queue={queue}
            showThumbs={showThumbs}
            t={t}
          />

          <GuestListTab
            listSearch={listSearch}
            setListSearch={setListSearch}
            allSongs={allSongs}
            allowSuggestFromList={allowSuggestFromList}
            submitVotingProposal={submitVotingProposal}
            myProposal={myProposal}
            myProposedIds={myProposedIds}
            handleSuggestFromList={handleSuggestFromList}
            showThumbs={showThumbs}
            t={t}
          />

          <GuestEventTab
            partyDate={jukeboxState?.settings?.partyDate}
            partyLocation={jukeboxState?.settings?.partyLocation}
            partyDescription={jukeboxState?.settings?.partyDescription}
            lang={lang}
            t={t}
          />
        </div>
      </div>

      <div className="guest-footer">
        <div className="guest-footer-row">
          <button
            className={`guest-footer-btn guest-footer-btn--active${showThumbs ? ' active' : ''}`}
            onClick={() => setShowThumbs((value) => !value)}
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
