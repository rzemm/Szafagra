import { useEffect, useRef, useState } from 'react'
import { ScrollText } from './ScrollText'
import { useLanguage } from '../context/useLanguage'
import {
  extractSpotifyPlaylistId,
  fetchSpotifyPlaylist,
  matchTracksToYouTube,
  pickBestCandidateIndex,
} from '../lib/spotify'

export function SpotifyImportModal({ onClose, onImportSongs, existingYtIds = new Set() }) {
  const { t } = useLanguage()
  const [link, setLink] = useState('')
  const [step, setStep] = useState('input') // input | loading | review
  const [error, setError] = useState('')
  const [playlistName, setPlaylistName] = useState('')
  const [items, setItems] = useState([])
  const [matchedCount, setMatchedCount] = useState(0)
  const [matchingDone, setMatchingDone] = useState(false)
  const [importing, setImporting] = useState(false)
  const cancelledRef = useRef(false)

  useEffect(() => () => {
    cancelledRef.current = true
  }, [])

  const startMatching = (tracks) => {
    matchTracksToYouTube(tracks, {
      isCancelled: () => cancelledRef.current,
      onBatch: (startIndex, results) => {
        setItems((current) => {
          const next = [...current]
          for (let i = 0; i < results.length; i++) {
            const item = next[startIndex + i]
            if (!item) continue
            const candidates = results[i] ?? []
            const selectedIdx = pickBestCandidateIndex(item, candidates)
            const selected = selectedIdx >= 0 ? candidates[selectedIdx] : null
            next[startIndex + i] = {
              ...item,
              candidates,
              selectedIdx,
              matched: true,
              include: !!selected && !existingYtIds.has(selected.ytId),
            }
          }
          return next
        })
        setMatchedCount((count) => count + results.length)
      },
    }).then(() => {
      if (!cancelledRef.current) setMatchingDone(true)
    })
  }

  const handleFetch = async () => {
    const playlistId = extractSpotifyPlaylistId(link)
    if (!playlistId) {
      setError(t('spotifyImportInvalidLink'))
      return
    }

    setError('')
    setStep('loading')
    try {
      const playlist = await fetchSpotifyPlaylist(playlistId)
      if (cancelledRef.current) return
      if (!playlist.tracks?.length) {
        setError(t('spotifyImportEmpty'))
        setStep('input')
        return
      }
      setPlaylistName(playlist.name)
      const initialItems = playlist.tracks.map((track, index) => ({
        key: `${index}`,
        title: track.title,
        artists: track.artists,
        durationMs: track.durationMs,
        candidates: [],
        selectedIdx: -1,
        matched: false,
        include: false,
      }))
      setItems(initialItems)
      setMatchedCount(0)
      setMatchingDone(false)
      setStep('review')
      startMatching(initialItems)
    } catch {
      if (cancelledRef.current) return
      setError(t('spotifyImportLoadError'))
      setStep('input')
    }
  }

  const toggleInclude = (key) => {
    setItems((current) => current.map((item) => (
      item.key === key && item.selectedIdx >= 0 ? { ...item, include: !item.include } : item
    )))
  }

  const cycleCandidate = (key) => {
    setItems((current) => current.map((item) => {
      if (item.key !== key || item.candidates.length < 2) return item
      const selectedIdx = (item.selectedIdx + 1) % item.candidates.length
      return { ...item, selectedIdx }
    }))
  }

  const selectedItems = items.filter((item) => item.include && item.selectedIdx >= 0)

  const handleImport = async () => {
    if (!selectedItems.length || importing) return
    setImporting(true)
    try {
      const songs = selectedItems.map((item) => {
        const candidate = item.candidates[item.selectedIdx]
        return {
          ytId: candidate.ytId,
          title: item.artists ? `${item.artists} - ${item.title}` : item.title,
          url: `https://youtu.be/${candidate.ytId}`,
        }
      })
      await onImportSongs(songs)
    } finally {
      setImporting(false)
    }
  }

  const headerTitle = step === 'review' && playlistName
    ? `${playlistName} (${items.length})`
    : t('spotifyImportTitle')

  return (
    <div className="ytimport-overlay" role="presentation" onClick={onClose}>
      <div
        className="ytimport-modal"
        role="dialog"
        aria-modal="true"
        aria-label={headerTitle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ytimport-header">
          <span className="ytimport-title">{headerTitle}</span>
          <button className="ytimport-close" onClick={onClose} aria-label={t('closeModal')}>&#x2715;</button>
        </div>

        <div className="ytimport-body">
          {step === 'input' && (
            <div className="ytimport-detail">
              <p className="ytimport-status" style={{ textAlign: 'left' }}>{t('spotifyImportDesc')}</p>
              <input
                className="song-settings-input"
                type="text"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleFetch()}
                placeholder="https://open.spotify.com/playlist/..."
                autoFocus
                spellCheck={false}
              />
              {error && <div className="ytimport-error">{error}</div>}
              <button
                className="ytimport-action-btn ytimport-action-btn--primary"
                onClick={handleFetch}
                disabled={!link.trim()}
              >
                {t('spotifyImportFetch')}
              </button>
              <p className="ytimport-status" style={{ fontSize: '0.78rem' }}>{t('spotifyImportLimitNote')}</p>
            </div>
          )}

          {step === 'loading' && (
            <div className="ytimport-status">{t('spotifyImportLoading')}</div>
          )}

          {step === 'review' && (
            <div className="ytimport-detail">
              <div className="ytimport-detail-nav">
                {!matchingDone ? (
                  <span className="ytimport-status" style={{ padding: 0 }}>
                    {t('spotifyImportMatching', Math.min(matchedCount, items.length), items.length)}
                  </span>
                ) : (
                  <span className="ytimport-status" style={{ padding: 0 }}>
                    {t('spotifyImportMatchedCount', selectedItems.length)}
                  </span>
                )}
                <button
                  className="ytimport-action-btn ytimport-action-btn--primary ytimport-import-selected-btn"
                  onClick={handleImport}
                  disabled={importing || selectedItems.length === 0}
                >
                  {importing ? '...' : t('spotifyImportSubmit', selectedItems.length)}
                </button>
              </div>

              <div className="ytimport-songs-list">
                {items.map((item) => {
                  const candidate = item.selectedIdx >= 0 ? item.candidates[item.selectedIdx] : null
                  const alreadyOnList = candidate && existingYtIds.has(candidate.ytId)
                  return (
                    <div
                      key={item.key}
                      className={`song-item${candidate ? ' song-item-clickable' : ''}${item.include ? ' song-item--selected' : ''}${alreadyOnList ? ' song-item--exists' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <div
                        onClick={() => candidate && !alreadyOnList && toggleInclude(item.key)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0, cursor: candidate ? 'pointer' : 'default' }}
                      >
                        {candidate ? (
                          <img src={`https://img.youtube.com/vi/${candidate.ytId}/default.jpg`} alt="" className="song-thumb" />
                        ) : (
                          <div className="song-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                            {item.matched ? '✕' : '…'}
                          </div>
                        )}
                        <div className="song-title-col" style={{ minWidth: 0 }}>
                          <ScrollText className="song-title">
                            {item.artists ? `${item.artists} - ${item.title}` : item.title}
                          </ScrollText>
                          <span style={{ fontSize: '0.72rem', opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                            {candidate ? candidate.title : item.matched ? t('spotifyImportNoMatch') : ''}
                          </span>
                        </div>
                      </div>
                      {item.candidates.length > 1 && (
                        <button
                          className="btn-icon"
                          onClick={() => cycleCandidate(item.key)}
                          title={t('spotifyImportNextMatch')}
                        >
                          {'↻'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
