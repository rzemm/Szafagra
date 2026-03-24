import { VotingPanel } from '../VotingPanel'

export function OwnerVotingDock({ roomMode, ui, playback, voting, showThumbnails, t }) {
  if (roomMode === 'party_prep') return null

  const voteCounts = voting.nextOptionKeys.map((key) =>
    Object.values(voting.nextVotesData).filter((value) => value === key).length
  )
  const totalVotes = Object.values(voting.nextVotesData).length
  const maxCount = Math.max(0, ...voteCounts)

  return (
    <div className="voting-panel-bottom" onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()}>
      <div className="voting-bottom-bar" onClick={(event) => {
        event.stopPropagation()
        const willOpen = !ui.panelOpen.voting
        ui.togglePanel('voting')
        if (willOpen && ui.leftPanel) ui.toggleLeftPanel(ui.leftPanel)
      }}>
        {playback.isPlaying && voting.nextOptionKeys.length > 0 ? voting.nextOptionKeys.map((key, index) => {
          const count = voteCounts[index]
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
          const isWinning = count > 0 && count === maxCount

          return (
            <div key={key} className={`voting-bar-opt${isWinning ? ' winning' : ''}`}>
              <div className="vbo-fill" style={{ height: `${pct}%` }} />
              <span className="vbo-thumb">👍</span>
              <span className="vbo-num">{count}</span>
              <span className="vbo-sep"> - </span>
              <span className="vbo-pct">{pct}%</span>
            </div>
          )
        }) : (
          <h2 className="section-title" style={{ flex: 1, padding: '0 1rem' }}>{t('votingOptionsTitle')}</h2>
        )}
        <span className="section-arrow" style={{ padding: '0 1rem' }}>{ui.panelOpen.voting ? 'v' : '^'}</span>
      </div>

      {ui.panelOpen.voting && (
        <div className="voting-bottom-content">
          {playback.isPlaying && voting.nextOptionKeys.length > 0 && (
            <VotingPanel
              nextOptionKeys={voting.nextOptionKeys}
              nextOptions={voting.nextOptions}
              nextVotesData={voting.nextVotesData}
              showPlayNow
              onPlayNow={voting.playSongNow}
              onQueueSong={voting.queueSong}
              onRemoveOption={voting.removeVotingOption}
              onReplaceSong={voting.replaceSong}
              columns
              onChooseOption={voting.advanceToOption}
              showThumbnails={showThumbnails}
            />
          )}
        </div>
      )}
    </div>
  )
}
