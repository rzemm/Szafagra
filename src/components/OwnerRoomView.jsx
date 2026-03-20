import { QRCodeSVG } from 'qrcode.react'
import { NowPlayingPanel } from './NowPlayingPanel'
import { PlaylistSidebar } from './PlaylistSidebar'
import { ScrollText } from './ScrollText'
import { VotingPanel } from './VotingPanel'

export function OwnerRoomView({
  canEditRoom,
  roomType,
  leftPanel,
  panelOpen,
  togglePanel,
  room,
  currentSong,
  isPlaying,
  remaining,
  ytPlayerState,
  loadProgress,
  playerRef,
  playerDivRef,
  playerReady,
  advanceToWinner,
  skipThreshold,
  skipCount,
  startJukebox,
  stopJukebox,
  voteMode,
  queue,
  voteThreshold,
  saveSettings,
  suggestions,
  showThumbnails,
  playlistActions,
  songActions,
  settings,
  nextOptionKeys,
  nextOptions,
  nextVotesData,
  userId,
  vote,
  playSongNow,
  queueSong,
  removeVotingOption,
  advanceToOption,
  shareLinks,
  copied,
  renameRoom,
  isVisible,
  isViewMode,
  handleCopyRoom,
  copyingRoom,
  approveSuggestion,
  rejectSuggestion,
  removeFromQueue,
  localCurrentSongId,
  handleLocalPlay,
  uiState,
  setField,
  toggleSection,
  startEditPlaylist,
  cancelEditPlaylist,
}) {
  const voteCounts = nextOptionKeys.map((key) => Object.values(nextVotesData).filter((value) => value === key).length)
  const totalVotes = Object.values(nextVotesData).length
  const maxCount = Math.max(0, ...voteCounts)

  return (
    <>
      <PlaylistSidebar
        leftPanel={leftPanel}
        isPlaying={isPlaying}
        room={room}
        currentSong={currentSong}
        playSongNow={playSongNow}
        deleteSong={songActions.deleteSong}
        suggestions={suggestions}
        approveSuggestion={approveSuggestion}
        rejectSuggestion={rejectSuggestion}
        showThumbnails={showThumbnails}
        queue={queue}
        voteThreshold={voteThreshold}
        voteMode={voteMode}
        skipThreshold={skipThreshold}
        allowSuggestions={settings.allowSuggestions ?? true}
        allowGuestListening={settings.allowGuestListening ?? true}
        tickerText={settings.tickerText ?? ''}
        tickerOnScreen={settings.tickerOnScreen ?? false}
        tickerForGuests={settings.tickerForGuests ?? false}
        queueSize={Math.max(1, settings.queueSize ?? 1)}
        saveSettings={saveSettings}
        importPlaylist={playlistActions.importPlaylist}
        exportPlaylist={playlistActions.exportPlaylist}
        queueSong={queueSong}
        removeFromQueue={removeFromQueue}
        copyAdminLink={shareLinks.copyAdminLink}
        copied={copied}
        roomType={roomType}
        onRenameRoom={renameRoom}
        showQr={panelOpen.qr}
        showQueueOverlay={panelOpen.showQueue}
        onToggleQr={() => togglePanel('qr')}
        onToggleQueueOverlay={() => togglePanel('showQueue')}
        isVisible={isVisible}
        canEditRoom={canEditRoom}
        isViewMode={isViewMode}
        onLocalPlay={handleLocalPlay}
        localCurrentSongId={localCurrentSongId}
        editingId={uiState.editingId}
        editingName={uiState.editingName}
        startEditPlaylist={startEditPlaylist}
        cancelEditPlaylist={cancelEditPlaylist}
        setEditingName={(value) => setField('editingName', value)}
        saveEditPlaylist={playlistActions.saveEditPlaylist}
        ytPlaylistId={uiState.ytPlaylistId}
        importingYtPlaylist={uiState.importingYtPlaylist}
        importFromYouTube={songActions.importFromYouTube}
        collapsed={uiState.collapsed}
        toggleSection={toggleSection}
      />

      <div className="player-area player-area-admin">
        {panelOpen.showQueue && queue.length > 0 && (
          <div className="queue-overlay">
            {queue.map((song) => (
              <div key={song.id} className="queue-overlay-item">
                <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-overlay-thumb" />
                <ScrollText className="queue-overlay-title">{song.title}</ScrollText>
              </div>
            ))}
          </div>
        )}

        <div className="admin-scroll-area">
          {isViewMode && (
            <div className="view-mode-banner">
              <span className="view-mode-label">Tryb podgladu - lista tylko do odczytu</span>
              <button
                className="view-mode-copy-btn"
                onClick={handleCopyRoom}
                disabled={copyingRoom}
              >
                {copyingRoom ? 'Kopiowanie...' : 'Skopiuj te liste do siebie'}
              </button>
            </div>
          )}

          <div className="admin-top-row">
            <NowPlayingPanel
              isPlaying={isPlaying}
              currentSong={currentSong}
              remaining={remaining}
              ytPlayerState={ytPlayerState}
              loadProgress={loadProgress}
              playerRef={playerRef}
              playerDivRef={playerDivRef}
              playerReady={playerReady}
              advanceToWinner={advanceToWinner}
              skipThreshold={skipThreshold}
              skipCount={skipCount}
              startJukebox={startJukebox}
              stopJukebox={stopJukebox}
              room={room}
              canEditRoom={canEditRoom}
            />

            {shareLinks.voterUrl && panelOpen.qr && (
              <div className="admin-qr-panel">
                <div className="qr-clickable" onClick={shareLinks.copyVoterLink} title="Kliknij aby skopiowac link">
                  <QRCodeSVG value={shareLinks.voterUrl} size={150} bgColor="#000000" fgColor="#ffffff" />
                  {copied === 'voter' && <div className="qr-copied-overlay">✓ Skopiowano</div>}
                </div>
                <p className="qr-hint">Kliknij QR, aby skopiowac link</p>
              </div>
            )}
          </div>
        </div>

        {settings.tickerOnScreen && settings.tickerText && (
          <div className="admin-ticker">📢 {settings.tickerText}</div>
        )}

        <div className="voting-panel-bottom">
          <div className="voting-bottom-bar" onClick={() => togglePanel('voting')}>
            {isPlaying && nextOptionKeys.length > 0 ? nextOptionKeys.map((key, index) => {
              const count = voteCounts[index]
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
              const isWinning = count > 0 && count === maxCount

              return (
                <div key={key} className={`voting-bar-opt${isWinning ? ' winning' : ''}`}>
                  <div className="vbo-fill" style={{ height: `${pct}%` }} />
                  <span className="vbo-num">{count}</span>
                  <span className="vbo-pct">{pct}%</span>
                </div>
              )
            }) : (
              <h2 className="section-title" style={{ flex: 1, padding: '0 1rem' }}>Glosowanie</h2>
            )}
            <span className="section-arrow" style={{ padding: '0 1rem' }}>{panelOpen.voting ? '▼' : '▲'}</span>
          </div>

          {panelOpen.voting && (
            <div className="voting-bottom-content">
              {isPlaying && nextOptionKeys.length > 0 && (
                <VotingPanel
                  nextOptionKeys={nextOptionKeys}
                  nextOptions={nextOptions}
                  nextVotesData={nextVotesData}
                  userId={userId}
                  onVote={vote}
                  showPlayNow
                  onPlayNow={playSongNow}
                  onQueueSong={queueSong}
                  onRemoveOption={removeVotingOption}
                  columns
                  onChooseOption={advanceToOption}
                  showThumbnails={showThumbnails}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
