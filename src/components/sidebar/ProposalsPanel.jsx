import { useLanguage } from '../../context/LanguageContext'

export function ProposalsPanel({ room, suggestions, showThumbnails, removeVotingProposal, approveSuggestion, rejectSuggestion, canEditRoom }) {
  const { t } = useLanguage()

  const votingProposals = room?.votingProposals ?? {}
  const proposalEntries = Object.entries(votingProposals)
  const newSongs = suggestions ?? []
  const totalCount = proposalEntries.length + newSongs.length

  return (
    <div className="section proposals-panel">
      <div className="section-title-row">
        <h2 className="section-title">
          {t('panelProposalsTitle')}
          {totalCount > 0 && <span className="count">{totalCount}</span>}
        </h2>
      </div>

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
                      <img
                        src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`}
                        alt=""
                        className="song-thumb"
                      />
                    )}
                    <span className="song-title proposals-item-title">{song.title}</span>
                    {canEditRoom && (
                      <button
                        className="btn-icon danger"
                        onClick={() => removeVotingProposal(userId)}
                        title={t('removeProposal')}
                      >
                        x
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {newSongs.length > 0 && (
            <>
              <p className="proposals-section-label">{t('proposalsNewSongs')}</p>
              <ul className="proposals-list">
                {newSongs.map((song) => (
                  <li key={song.id} className="proposals-item">
                    {showThumbnails && (
                      <img
                        src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`}
                        alt=""
                        className="song-thumb"
                      />
                    )}
                    <span className="song-title proposals-item-title">{song.title}</span>
                    {canEditRoom && (
                      <>
                        <button
                          className="btn-icon"
                          onClick={() => approveSuggestion(song)}
                          title={t('approveAllSongs')}
                        >
                          ✓
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => rejectSuggestion(song.id)}
                          title={t('reject')}
                        >
                          x
                        </button>
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
