import { QRCodeSVG } from 'qrcode.react'
import { NowPlayingPanel } from './NowPlayingPanel'
import { OwnerQueueOverlay } from './owner/OwnerQueueOverlay'
import { OwnerViewModeBanner } from './owner/OwnerViewModeBanner'
import { OwnerVotingDock } from './owner/OwnerVotingDock'
import { PlaylistSidebar } from './PlaylistSidebar'
import { useOwnerGestures } from '../hooks/useOwnerGestures'
import { useLanguage } from '../context/useLanguage'

export function OwnerRoomView({
  room,
  canEditRoom,
  ui,
  sidebar,
  playback,
  voting,
  sharing,
  viewMode,
}) {
  const { t } = useLanguage()
  const { handlePointerDown, handlePointerUp } = useOwnerGestures(ui)

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
        localPlayMode={false}
        onLocalPlay={viewMode.handleLocalPlay}
        localCurrentSongId={viewMode.localCurrentSongId}
        onSubmitMessage={sidebar.onSubmitMessage}
        removeVotingProposal={sidebar.removeVotingProposal}
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
            <OwnerViewModeBanner isViewMode={viewMode.isViewMode} viewMode={viewMode} t={t} />

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

          <OwnerQueueOverlay
            isOpen={ui.panelOpen.showQueue}
            queue={playback.queue}
            canEditRoom={canEditRoom}
            playback={playback}
            voting={voting}
            t={t}
          />

          {sidebar.settings.tickerOnScreen && sidebar.settings.tickerText && (
            <div className="admin-ticker">{sidebar.settings.tickerText}</div>
          )}
        </div>

        {playback.isPlaying && playback.skipThreshold > 0 && playback.skipCount > 0 && (
          <div className="skip-votes-banner">
            {Array.from({ length: playback.skipCount }, (_, index) => (
              <span key={index} className="skip-vote-x">âťŚ</span>
            ))}
          </div>
        )}

        <OwnerVotingDock
          ui={ui}
          playback={playback}
          voting={voting}
          showThumbnails={sidebar.showThumbnails}
          t={t}
        />
      </div>
    </>
  )
}
