import { useCallback, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { NowPlayingPanel } from './NowPlayingPanel'
import { PlaylistSidebar } from './PlaylistSidebar'
import { ScrollText } from './ScrollText'
import { VotingPanel } from './VotingPanel'
import { useLanguage } from '../context/LanguageContext'

export function OwnerRoomView({
  room,
  canEditRoom,
  roomMode,
  ui,
  sidebar,
  playback,
  voting,
  sharing,
  viewMode,
}) {
  const { t } = useLanguage()
  const [appendTargetId, setAppendTargetId] = useState('')
  const [appendDone, setAppendDone] = useState(false)

  const dragStart = useRef(null)

  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('button, input, select, a, label, [role="button"], .qr-clickable')) return
    dragStart.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handlePointerUp = useCallback((e) => {
    if (!dragStart.current) return
    if (e.target.closest('button, input, select, a, label, [role="button"], .qr-clickable')) {
      dragStart.current = null
      return
    }
    const dx = e.clientX - dragStart.current.x  // > 0 = w prawo
    const dy = dragStart.current.y - e.clientY  // > 0 = w górę
    dragStart.current = null

    const THRESHOLD = 40
    const isSwipeRight = dx > THRESHOLD && dx > Math.abs(dy)
    const isSwipeUp = dy > THRESHOLD && dy > Math.abs(dx)
    const isClick = Math.abs(dx) < 15 && Math.abs(dy) < 15

    if (isSwipeRight) {
      if (ui.leftPanel) {
        // ten sam panel → zwiń
        ui.toggleLeftPanel(ui.leftPanel)
      } else {
        // inny lub nic → zamknij dolny, otwórz lewy
        if (ui.panelOpen.voting) ui.togglePanel('voting')
        ui.toggleLeftPanel('songs')
      }
    } else if (isSwipeUp) {
      if (ui.panelOpen.voting) {
        // ten sam panel → zwiń
        ui.togglePanel('voting')
      } else {
        // inny lub nic → zamknij lewy, otwórz dolny
        if (ui.leftPanel) ui.toggleLeftPanel(ui.leftPanel)
        ui.togglePanel('voting')
      }
    } else if (isClick) {
      const anyOpen = ui.leftPanel || ui.panelOpen.voting
      if (anyOpen) {
        if (ui.leftPanel) ui.toggleLeftPanel(ui.leftPanel)
        if (ui.panelOpen.voting) ui.togglePanel('voting')
      } else {
        ui.toggleLeftPanel('songs')
      }
    }
  }, [ui])

  const handleAppend = async () => {
    if (!appendTargetId) return
    await viewMode.handleAppendToRoom(appendTargetId)
    setAppendDone(true)
    setTimeout(() => setAppendDone(false), 3000)
  }

  const voteCounts = voting.nextOptionKeys.map((key) =>
    Object.values(voting.nextVotesData).filter((value) => value === key).length
  )
  const totalVotes = Object.values(voting.nextVotesData).length
  const maxCount = Math.max(0, ...voteCounts)

  return (
    <>
      <PlaylistSidebar
        leftPanel={ui.leftPanel}
        isPlaying={playback.isPlaying}
        room={room}
        currentSong={playback.currentSong}
        playSongNow={voting.playSongNow}
        deleteSong={sidebar.songActions.deleteSong}
        deleteSongs={sidebar.songActions.deleteSongs}
        updateSong={sidebar.songActions.updateSong}
        addSong={sidebar.songActions.addSongDirect}
        suggestions={sidebar.suggestions}
        approveSuggestion={sidebar.approveSuggestion}
        approvePlaylistSuggestion={sidebar.approvePlaylistSuggestion}
        rejectSuggestion={sidebar.rejectSuggestion}
        showThumbnails={sidebar.showThumbnails}
        showAddedBy={sidebar.showAddedBy}
        queue={playback.queue}
        voteThreshold={voting.voteThreshold}
        voteMode={voting.voteMode}
        skipThreshold={playback.skipThreshold}
        allowSuggestions={sidebar.settings.allowSuggestions ?? true}
        allowSuggestFromList={sidebar.settings.allowSuggestFromList ?? false}
        allowGuestListening={sidebar.settings.allowGuestListening ?? false}
        tickerText={sidebar.settings.tickerText ?? ''}
        tickerOnScreen={sidebar.settings.tickerOnScreen ?? false}
        tickerForGuests={sidebar.settings.tickerForGuests ?? false}
        queueSize={Math.max(1, sidebar.settings.queueSize ?? 1)}
        saveSettings={sidebar.saveSettings}
        importPlaylist={sidebar.playlistActions.importPlaylist}
        exportPlaylist={sidebar.playlistActions.exportPlaylist}
        queueSong={voting.queueSong}
        removeFromQueue={playback.removeFromQueue}
        copyAdminLink={sharing.shareLinks.copyAdminLink}
        copied={sharing.copied}
        roomType={sidebar.roomType}
        onRenameRoom={sidebar.renameRoom}
        onChangeRoomCode={sidebar.changeRoomCode}
        onCreateRoomFromYt={sidebar.onCreateRoomFromYt}
        onAddYtToRoom={sidebar.onAddYtToRoom}
        ownedRooms={sidebar.ownedRooms}
        showQr={ui.panelOpen.qr}
        showQueueOverlay={ui.panelOpen.showQueue}
        showRoomCode={ui.panelOpen.showRoomCode}
        onToggleQr={() => ui.togglePanel('qr')}
        onToggleQueueOverlay={() => ui.togglePanel('showQueue')}
        onToggleShowRoomCode={() => ui.togglePanel('showRoomCode')}
        isVisible={sidebar.isVisible}
        canEditRoom={canEditRoom}
        isViewMode={viewMode.isViewMode}
        localPlayMode={roomMode === 'party_prep'}
        onLocalPlay={viewMode.handleLocalPlay}
        localCurrentSongId={viewMode.localCurrentSongId}
        onSubmitMessage={sidebar.onSubmitMessage}
        removeVotingProposal={sidebar.removeVotingProposal}
        roomMode={sidebar.settings.roomMode ?? 'party_prep'}
        openParty={sidebar.settings.openParty ?? false}
        partyDate={sidebar.settings.partyDate ?? ''}
        partyLocation={sidebar.settings.partyLocation ?? ''}
        partyDescription={sidebar.settings.partyDescription ?? ''}
        newSongUrl={sidebar.newSongUrl}
        handleSongUrlChange={sidebar.handleSongUrlChange}
        handleUrlBlur={sidebar.handleUrlBlur}
        addSongByUrl={sidebar.addSong}
        songSearchSuggestions={sidebar.songSearchSuggestions}
        selectSuggestion={sidebar.selectSuggestion}
        clearSuggestions={sidebar.clearSuggestions}
        newSongTitle={sidebar.newSongTitle}
        fetchingTitle={sidebar.fetchingTitle}
        urlErr={sidebar.urlErr}
      />

      <div className="player-area player-area-admin" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <div className="scroll-ticker-wrap">
          <div className="admin-scroll-area">
            {viewMode.isViewMode && (
              <div className="view-mode-banner">
                <span className="view-mode-label">{t('viewModeLabel')}</span>
                <button
                  className="view-mode-copy-btn"
                  onClick={viewMode.handleCopyRoom}
                  disabled={viewMode.copyingRoom}
                >
                  {viewMode.copyingRoom ? t('copying') : t('copyThisList')}
                </button>
                {viewMode.ownedRooms?.length > 0 && (
                  <div className="view-mode-append-row">
                    <select
                      className="view-mode-append-select"
                      value={appendTargetId}
                      onChange={(event) => {
                        setAppendTargetId(event.target.value)
                        setAppendDone(false)
                      }}
                    >
                      <option value="">{t('appendSongsTo')}</option>
                      {viewMode.ownedRooms.map((ownedRoom) => (
                        <option key={ownedRoom.id} value={ownedRoom.id}>
                          {ownedRoom.name || t('privateRoom')}
                        </option>
                      ))}
                    </select>
                    {appendTargetId && (
                      <button
                        className="view-mode-append-btn"
                        onClick={handleAppend}
                        disabled={viewMode.appendingRoom || appendDone}
                      >
                        {appendDone
                          ? t('appended')
                          : viewMode.appendingRoom
                            ? t('appending')
                            : t('append')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="admin-top-row">
              <NowPlayingPanel
                isPlaying={playback.isPlaying}
                currentSong={playback.currentSong}
                remaining={playback.remaining}
                ytPlayerState={playback.ytPlayerState}
                loadProgress={playback.loadProgress}
                playerRef={playback.playerRef}
                playerDivRef={playback.playerDivRef}
                playerReady={playback.playerReady}
                advanceToWinner={playback.advanceToWinner}
                skipThreshold={playback.skipThreshold}
                skipCount={playback.skipCount}
                startJukebox={playback.startJukebox}
                stopJukebox={playback.stopJukebox}
                room={room}
                canEditRoom={canEditRoom}
              />
              {sharing.shareLinks.voterUrl && (ui.panelOpen.qr || ui.panelOpen.showRoomCode) && (
                <div className="admin-qr-panel">
                  {ui.panelOpen.qr && (
                    <>
                      <div className="qr-clickable" onClick={sharing.shareLinks.copyVoterLink} title={t('clickToCopyLink')}>
                        <QRCodeSVG value={sharing.shareLinks.voterUrl} size={150} bgColor="#000000" fgColor="#ffffff" />
                        {sharing.copied === 'voter' && <div className="qr-copied-overlay">OK {t('copiedLabel')}</div>}
                      </div>
                      <p className="qr-hint">{t('clickQrToCopy')}</p>
                    </>
                  )}
                  {ui.panelOpen.showRoomCode && room?.guestToken && (
                    <div className="admin-room-code">{room.guestToken}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {ui.panelOpen.showQueue && (
            <div className="queue-overlay" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
              {playback.queue.length > 0 ? (
                <ol className="queue-overlay-list">
                  {playback.queue.map((song) => (
                    <div
                      key={song.id}
                      className={`queue-overlay-item${canEditRoom ? ' queue-overlay-item--clickable' : ''}`}
                      onClick={canEditRoom ? () => { voting.playSongNow(song); playback.removeFromQueue(song.id) } : undefined}
                    >
                      <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="queue-overlay-thumb" />
                      <ScrollText className="queue-overlay-title">{song.title}</ScrollText>
                      {canEditRoom && (
                        <button
                          className="queue-overlay-delete"
                          onClick={(e) => { e.stopPropagation(); playback.removeFromQueue(song.id) }}
                          title={t('removeFromQueue')}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </ol>
              ) : (
                <p className="queue-overlay-empty">{playback.isPlaying ? t('queueEmpty') : t('playbackStopped')}</p>
              )}
            </div>
          )}
          {sidebar.settings.tickerOnScreen && sidebar.settings.tickerText && (
            <div className="admin-ticker">{sidebar.settings.tickerText}</div>
          )}
        </div>

        {playback.isPlaying && playback.skipThreshold > 0 && playback.skipCount > 0 && (
          <div className="skip-votes-banner">
            {Array.from({ length: playback.skipCount }, (_, i) => (
              <span key={i} className="skip-vote-x">❌</span>
            ))}
          </div>
        )}

        {roomMode !== 'party_prep' && <div className="voting-panel-bottom" onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
          <div className="voting-bottom-bar" onClick={(e) => {
            e.stopPropagation()
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
                  showThumbnails={sidebar.showThumbnails}
                />
              )}
            </div>
          )}
        </div>}
      </div>
    </>
  )
}
