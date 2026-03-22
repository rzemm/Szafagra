import { useCallback, useEffect, useRef, useState } from 'react'
import { SongsPanel } from './sidebar/SongsPanel'
import { QueuePanel } from './sidebar/QueuePanel'
import { SettingsPanel } from './sidebar/SettingsPanel'

export function PlaylistSidebar({
  leftPanel,
  isPlaying,
  room,
  currentSong,
  playSongNow,
  deleteSong,
  deleteSongs,
  updateSong,
  suggestions,
  approveSuggestion,
  rejectSuggestion,
  showThumbnails,
  queue,
  voteThreshold,
  voteMode,
  skipThreshold,
  allowSuggestions,
  allowGuestListening,
  tickerText,
  tickerOnScreen,
  tickerForGuests,
  queueSize,
  saveSettings,
  importPlaylist,
  exportPlaylist,
  queueSong,
  removeFromQueue,
  copyAdminLink,
  copied,
  roomType,
  onRenameRoom,
  showQr,
  showQueueOverlay,
  showRoomCode,
  onToggleQr,
  onToggleQueueOverlay,
  onToggleShowRoomCode,
  isVisible,
  canEditRoom,
  isViewMode,
  onLocalPlay,
  localCurrentSongId,
  onSubmitMessage,
}) {
  const [sidebarWidth, setSidebarWidth] = useState(360)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(360)

  const handleResizeMouseDown = useCallback((e) => {
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
  }, [sidebarWidth])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isResizing.current) return
      const delta = e.clientX - startX.current
      setSidebarWidth(Math.min(600, Math.max(200, startWidth.current + delta)))
    }
    const onMouseUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <>
    <aside
      className={`sidebar${leftPanel ? '' : ' sidebar-hidden'}`}
      style={leftPanel ? { width: sidebarWidth } : undefined}
    >
      {leftPanel === 'songs' && room && (
        <SongsPanel
          room={room}
          isPlaying={isPlaying}
          currentSong={currentSong}
          playSongNow={playSongNow}
          deleteSong={deleteSong}
          deleteSongs={deleteSongs}
          updateSong={updateSong}
          showThumbnails={showThumbnails}
          queueSong={queueSong}
          canEditRoom={canEditRoom}
          isViewMode={isViewMode}
          onLocalPlay={onLocalPlay}
          localCurrentSongId={localCurrentSongId}
        />
      )}

      {leftPanel === 'queue' && (
        <QueuePanel
          isPlaying={isPlaying}
          queue={queue}
          voteThreshold={voteThreshold}
          saveSettings={saveSettings}
          showThumbnails={showThumbnails}
          canEditRoom={canEditRoom}
          playSongNow={playSongNow}
          removeFromQueue={removeFromQueue}
        />
      )}

      {leftPanel === 'settings' && (
        <SettingsPanel
          room={room}
          suggestions={suggestions}
          approveSuggestion={approveSuggestion}
          rejectSuggestion={rejectSuggestion}
          showThumbnails={showThumbnails}
          voteThreshold={voteThreshold}
          voteMode={voteMode}
          skipThreshold={skipThreshold}
          allowSuggestions={allowSuggestions}
          allowGuestListening={allowGuestListening}
          tickerText={tickerText}
          tickerOnScreen={tickerOnScreen}
          tickerForGuests={tickerForGuests}
          queueSize={queueSize}
          saveSettings={saveSettings}
          exportPlaylist={exportPlaylist}
          importPlaylist={importPlaylist}
          copyAdminLink={copyAdminLink}
          copied={copied}
          roomType={roomType}
          onRenameRoom={onRenameRoom}
          showQr={showQr}
          showQueueOverlay={showQueueOverlay}
          showRoomCode={showRoomCode}
          onToggleQr={onToggleQr}
          onToggleQueueOverlay={onToggleQueueOverlay}
          onToggleShowRoomCode={onToggleShowRoomCode}
          isVisible={isVisible}
          canEditRoom={canEditRoom}
          onSubmitMessage={onSubmitMessage}
        />
      )}
    </aside>
    {leftPanel && (
      <div className="sidebar-resize-handle" onMouseDown={handleResizeMouseDown} />
    )}
    </>
  )
}
