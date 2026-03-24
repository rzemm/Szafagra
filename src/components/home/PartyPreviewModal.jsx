import { useState } from 'react'
import { toggleEventInterest } from '../../services/jukeboxService'

function getVisitorId() {
  let id = localStorage.getItem('szafagra_vid')
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    localStorage.setItem('szafagra_vid', id)
  }
  return id
}

export function PartyPreviewModal({ party, lang, t, onClose }) {
  const visitorId = getVisitorId()
  const [partySearch, setPartySearch] = useState('')
  const [partyShowThumbs, setPartyShowThumbs] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const interested = !!(party.eventInterest?.[visitorId])
  const interestCount = Object.keys(party.eventInterest ?? {}).length
  const date = party.settings?.partyDate
  const location = party.settings?.partyLocation
  const description = party.settings?.partyDescription
  const formattedDate = date
    ? new Date(date).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null
  const songs = party.songs ?? []
  const filteredSongs = partySearch.trim()
    ? songs.filter((song) => song.title?.toLowerCase().includes(partySearch.toLowerCase()))
    : songs
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?party=${encodeURIComponent(party.id)}`
    : `/?party=${encodeURIComponent(party.id)}`
  const shareTitle = party.name || t('defaultRoomName')

  const handleShare = async () => {
    const shareData = {
      title: shareTitle,
      text: t('partyShareText'),
      url: shareUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 1800)
    } catch {
      // Ignore aborted share/copy interactions.
    }
  }

  const handleEnterRoom = () => {
    if (typeof window === 'undefined') return
    window.location.href = `/?room=${encodeURIComponent(party.id)}`
  }

  return (
    <div className="room-preview-overlay" role="presentation" onClick={onClose}>
      <div className="party-preview-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="party-preview-header">
          <span className="room-preview-title">{party.name || t('defaultRoomName')}</span>
          <button className="room-preview-close" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="party-preview-meta">
          {formattedDate && <span className="party-preview-date">{'\uD83D\uDCC5'} {formattedDate}</span>}
          {location && (
            <a
              className="party-preview-location"
              href={`https://www.google.com/maps/search/${encodeURIComponent(location)}`}
              target="_blank"
              rel="noreferrer"
            >
              {'\uD83D\uDCCD'} {location}
            </a>
          )}
          {description && <p className="party-preview-desc">{description}</p>}
        </div>

        <div className="party-preview-controls">
          <input
            className="party-preview-search"
            type="text"
            placeholder={t('partySearchPlaceholder')}
            value={partySearch}
            onChange={(event) => setPartySearch(event.target.value)}
          />
          <button
            className={`party-preview-thumbs-btn${partyShowThumbs ? ' active' : ''}`}
            onClick={() => setPartyShowThumbs((value) => !value)}
          >
            {'\uD83D\uDDBC'} {t('showThumbnailsBtn')}
          </button>
        </div>

        <div className="party-preview-actions">
          <button className="party-preview-action-btn" onClick={handleShare}>
            {'\u2197'} {shareCopied ? t('copiedLabel') : t('shareBtn')}
          </button>
          <button className="party-preview-action-btn party-preview-action-btn--primary" onClick={handleEnterRoom}>
            {'\u25B6'} {t('enterRoom')}
          </button>
        </div>

        <div className="room-preview-songs">
          {filteredSongs.length === 0 ? (
            <p className="party-preview-empty">{t('noResultsFor')} &ldquo;{partySearch}&rdquo;</p>
          ) : (
            filteredSongs.map((song, index) => (
              <div key={song.id ?? index} className={`room-preview-song${partyShowThumbs ? ' room-preview-song--thumb' : ''}`}>
                {partyShowThumbs && song.ytId && (
                  <img
                    src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`}
                    alt=""
                    className="party-preview-thumb"
                  />
                )}
                <span className="room-preview-song-num">{index + 1}</span>
                <span className="room-preview-song-title">{song.title}</span>
              </div>
            ))
          )}
        </div>

        <div className="party-preview-footer">
          {interestCount > 0 && (
            <span className="party-preview-interest-count">{t('interestedCount', interestCount)}</span>
          )}
          <button
            className={`party-preview-interest-btn${interested ? ' active' : ''}`}
            onClick={() => toggleEventInterest(party.id, visitorId, interested)}
          >
            {interested ? t('notInterestedBtn') : t('interestedBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
