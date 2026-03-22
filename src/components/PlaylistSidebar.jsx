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
  return (
    <aside className={`sidebar${leftPanel ? '' : ' sidebar-hidden'}`}>
      {leftPanel === 'songs' && room && (
        <SongsPanel
          room={room}
          isPlaying={isPlaying}
          currentSong={currentSong}
          playSongNow={playSongNow}
          deleteSong={deleteSong}
          deleteSongs={deleteSongs}
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
  )
}
