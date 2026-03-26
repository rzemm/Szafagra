import { ScrollText } from '../ScrollText'
import { useLanguage } from '../../context/useLanguage'

export function NominationsPanel({ model }) {
  const { room, canEditRoom, removeVotingProposal, playSongNow, showThumbnails } = model
  const { t } = useLanguage()

  const votingProposals = room?.votingProposals ?? {}
  const proposalEntries = Object.entries(votingProposals).sort(([, a], [, b]) => (a.addedAt ?? 0) - (b.addedAt ?? 0))

  return (
    <div className="section proposals-panel">
      {proposalEntries.length === 0 ? (
        <p className="proposals-empty">{t('noNominations')}</p>
      ) : (
        <ol className="queue-overlay-list nominations-list">
          {proposalEntries.map(([userId, song]) => (
            <div
              key={userId}
              className={`queue-overlay-item${canEditRoom ? ' queue-overlay-item--clickable' : ''}`}
              onClick={canEditRoom ? () => { playSongNow(song); removeVotingProposal(userId) } : undefined}
            >
              {showThumbnails && (
                <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-overlay-thumb" />
              )}
              <ScrollText className="queue-overlay-title">{song.title}</ScrollText>
              {canEditRoom && (
                <button
                  className="queue-overlay-delete"
                  onClick={(e) => { e.stopPropagation(); removeVotingProposal(userId) }}
                  title={t('removeProposal')}
                >×</button>
              )}
            </div>
          ))}
        </ol>
      )}
    </div>
  )
}
