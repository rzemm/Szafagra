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
      <PlaylistSidebar model={sidebar} />

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

          {sidebar.settingsPanel.tickerOnScreen && sidebar.settingsPanel.tickerText && (
            <div className="admin-ticker">{sidebar.settingsPanel.tickerText}</div>
          )}
        </div>

        {playback.isPlaying && playback.skipThreshold > 0 && playback.skipCount > 0 && (
          <div className="skip-votes-banner">
            {Array.from({ length: playback.skipCount }, (_, index) => (
              <span key={index} className="skip-vote-x">❌</span>
            ))}
          </div>
        )}

        <OwnerVotingDock
          ui={ui}
          playback={playback}
          voting={voting}
          showThumbnails={sidebar.settingsPanel.showThumbnails}
          t={t}
        />
      </div>
    </>
  )
}
