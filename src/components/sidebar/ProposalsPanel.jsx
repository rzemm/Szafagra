import { lazy, Suspense, useState } from 'react'
import { useLanguage } from '../../context/useLanguage'
import { useYouTubeAuth } from '../../hooks/useYouTubeAuth'
import { ScrollText } from '../ScrollText'

const LazyYouTubeImportModal = lazy(() => import('../YouTubeImportModal').then((module) => ({ default: module.YouTubeImportModal })))

const IconYouTube = () => (
  <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="28" height="20" rx="4" fill="#FF0000"/>
    <path d="M11.5 6l6 4-6 4V6z" fill="#fff"/>
  </svg>
)

const IconSpotify = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="11" cy="11" r="11" fill="#1DB954"/>
    <path d="M15.5 14.5c-2.5-1.5-5.5-1.6-9-0.9-0.4 0.1-0.5-0.5-0.1-0.6 3.7-0.8 7-0.6 9.7 1 0.3 0.2 0.1 0.7-0.6 0.5zm1-2.5c-2.9-1.8-7.3-2.3-10.7-1.3-0.4 0.1-0.7-0.3-0.4-0.6 3.8-1.1 8.5-0.6 11.7 1.4 0.4 0.2 0.1 0.8-0.6 0.5zm0.1-2.6C13.2 7.5 8 7.4 5 8.3c-0.5 0.1-0.8-0.4-0.4-0.7 3.4-1 9-0.9 12.5 1.2 0.4 0.3 0.1 0.9-0.5 0.6z" fill="#fff"/>
  </svg>
)

export function ProposalsPanel({ model }) {
  const {
    room,
    suggestions,
    showThumbnails,
    removeVotingProposal,
    approveSuggestion,
    approveAllSuggestions,
    rejectSuggestion,
    canEditRoom,
    onCreateRoomFromYt,
    onAddYtToRoom,
    ownedRooms,
    newSongUrl,
    handleSongUrlChange,
    handleUrlBlur,
    addSongByUrl,
    songSearchSuggestions = [],
    selectSuggestion,
    clearSuggestions,
    newSongTitle,
    fetchingTitle,
    urlErr,
  } = model
  const { t } = useLanguage()
  const yt = useYouTubeAuth()
  const [showYtImport, setShowYtImport] = useState(false)

  const votingProposals = room?.votingProposals ?? {}
  const proposalEntries = Object.entries(votingProposals).sort(([, a], [, b]) => (a.addedAt ?? 0) - (b.addedAt ?? 0))
  const newSongs = suggestions ?? []
  const totalCount = proposalEntries.length + newSongs.length

  return (
    <div className="section proposals-panel">
      <div className="settings-group">
        {canEditRoom && (
          <div className="proposals-add-song">
            <div className="song-input-wrapper">
              <input
                className="header-song-input"
                value={newSongUrl ?? ''}
                onChange={(event) => handleSongUrlChange(event.target.value)}
                onBlur={handleUrlBlur}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addSongByUrl()
                  if (event.key === 'Escape') clearSuggestions()
                }}
                placeholder={fetchingTitle ? t('fetchingTitlePlaceholder') : newSongTitle ? `${t('addSongTitlePrefix')} ${newSongTitle}` : t('addSongPlaceholder')}
                title={urlErr || undefined}
                style={urlErr ? { borderColor: 'var(--accent)' } : undefined}
                disabled={!room}
              />
              {songSearchSuggestions.length > 0 && (
                <ul className="song-suggestions-dropdown">
                  {songSearchSuggestions.map((suggestion) => (
                    <li
                      key={suggestion.ytId}
                      className="song-suggestion-item"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion.thumbnail && <img src={suggestion.thumbnail} className="suggestion-thumb" alt="" />}
                      <ScrollText className="suggestion-title">{suggestion.title}</ScrollText>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="btn-header-add" onClick={addSongByUrl} disabled={!newSongUrl?.trim() || !room}>+</button>
          </div>
        )}
        <div className="setting-row setting-row--service-icon">
          <IconYouTube />
          {yt.accessToken ? (
            <div className="service-btns-inline">
              <button className="btn-setting-action" onClick={() => setShowYtImport(true)}>{t('ytImportOpen')}</button>
              <button className="btn-setting-action" onClick={() => { yt.disconnect(); yt.connect() }}>{t('ytSwitchAccount')}</button>
              <button className="btn-setting-action btn-setting-action--dim" onClick={yt.disconnect}>{t('ytDisconnect')}</button>
            </div>
          ) : (
            <button className="btn-setting-action" style={{ flex: 1 }} onClick={yt.connect} disabled={yt.connecting}>
              {yt.connecting ? t('ytConnecting') : t('ytConnect')}
            </button>
          )}
          {yt.error && <span className="code-error-msg">{yt.error}</span>}
        </div>

        <div className="setting-row setting-row--service-disabled">
          <IconSpotify />
          <span className="service-soon">{t('comingSoon')}</span>
        </div>
      </div>

      {showYtImport && yt.accessToken && (
        <Suspense fallback={null}>
          <LazyYouTubeImportModal
            accessToken={yt.accessToken}
            onClose={() => setShowYtImport(false)}
            onCreateRoom={async (name, songs) => {
              await onCreateRoomFromYt(name, songs)
              yt.disconnect()
              setShowYtImport(false)
            }}
            onAddToRoom={async (roomId, songs) => {
              await onAddYtToRoom(roomId, songs)
              yt.disconnect()
              setShowYtImport(false)
            }}
            onPickSong={async (song) => {
              await onAddYtToRoom(room?.id, [song])
              setShowYtImport(false)
            }}
            currentRoomId={room?.id ?? null}
            ownedRooms={ownedRooms ?? []}
          />
        </Suspense>
      )}

      {totalCount === 0 ? (
        <p className="proposals-empty">{t('noVotingProposals')}</p>
      ) : (
        <>
          {proposalEntries.length > 0 && (
            <>
              <p className="proposals-section-label">{t('proposalsVoting')}</p>
              <ul className="proposals-list">
                {proposalEntries.map(([userId, song]) => (
                  <li key={userId} className="proposals-item">
                    {showThumbnails && (
                      <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />
                    )}
                    <span className="song-title proposals-item-title">{song.title}</span>
                    {canEditRoom && (
                      <button className="btn-icon danger" onClick={() => removeVotingProposal(userId)} title={t('removeProposal')}>x</button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {newSongs.length > 0 && (
            <>
              <div className="proposals-section-header">
                <p className="proposals-section-label">{t('proposalsNewSongs')}</p>
                {canEditRoom && newSongs.length > 1 && (
                  <button className="btn-setting-action" onClick={() => approveAllSuggestions(newSongs)}>{t('approveAll')}</button>
                )}
              </div>
              <ul className="proposals-list">
                {newSongs.map((song) => (
                  <li key={song.id} className="proposals-item">
                    {showThumbnails && (
                      <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />
                    )}
                    <span className="song-title proposals-item-title">{song.title}</span>
                    {canEditRoom && (
                      <>
                        <button className="btn-icon" onClick={() => approveSuggestion(song)} title={t('approveAllSongs')}>âś“</button>
                        <button className="btn-icon danger" onClick={() => rejectSuggestion(song.id)} title={t('reject')}>x</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  )
}
