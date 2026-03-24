import { useCallback, useEffect, useRef, useState } from 'react'
import { SongsPanel } from './sidebar/SongsPanel'
import { SettingsPanel } from './sidebar/SettingsPanel'
import { ProposalsPanel } from './sidebar/ProposalsPanel'

export function PlaylistSidebar({
  leftPanel,
  isPlaying,
  room,
  currentSong,
  playSongNow,
  deleteSong,
  deleteSongs,
  updateSong,
  addSong,
  suggestions,
  approveSuggestion,
  rejectSuggestion,
  showThumbnails,
  showAddedBy,
  voteThreshold,
  voteMode,
  skipThreshold,
  allowSuggestions,
  allowSuggestFromList,
  allowGuestListening,
  tickerText,
  tickerOnScreen,
  tickerForGuests,
  queueSize,
  saveSettings,
  importPlaylist,
  exportPlaylist,
  queueSong,
  onRenameRoom,
  onChangeRoomCode,
  onCreateRoomFromYt,
  onAddYtToRoom,
  ownedRooms,
  showQr,
  showQueueOverlay,
  showRoomCode,
  onToggleQr,
  onToggleQueueOverlay,
  onToggleShowRoomCode,
  isVisible,
  canEditRoom,
  isViewMode,
  localPlayMode,
  onLocalPlay,
  localCurrentSongId,
  onSubmitMessage,
  removeVotingProposal,
  roomMode,
  partyDate,
  partyLocation,
  partyDescription,
  newSongUrl,
  handleSongUrlChange,
  handleUrlBlur,
  addSongByUrl,
  songSearchSuggestions,
  selectSuggestion,
  clearSuggestions,
  newSongTitle,
  fetchingTitle,
  urlErr,
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
          addSong={addSong}
          showThumbnails={showThumbnails}
          showAddedBy={showAddedBy}
          queueSong={queueSong}
          canEditRoom={canEditRoom}
          isViewMode={isViewMode}
          localPlayMode={localPlayMode}
          onLocalPlay={onLocalPlay}
          localCurrentSongId={localCurrentSongId}
        />
      )}

      {leftPanel === 'settings' && (
        <SettingsPanel
          room={room}
          showThumbnails={showThumbnails}
          showAddedBy={showAddedBy}
          voteThreshold={voteThreshold}
          voteMode={voteMode}
          skipThreshold={skipThreshold}
          allowSuggestions={allowSuggestions}
          allowSuggestFromList={allowSuggestFromList}
          allowGuestListening={allowGuestListening}
          tickerText={tickerText}
          tickerOnScreen={tickerOnScreen}
          tickerForGuests={tickerForGuests}
          queueSize={queueSize}
          saveSettings={saveSettings}
          exportPlaylist={exportPlaylist}
          importPlaylist={importPlaylist}
          onRenameRoom={onRenameRoom}
          onChangeRoomCode={onChangeRoomCode}
          showQr={showQr}
          showQueueOverlay={showQueueOverlay}
          showRoomCode={showRoomCode}
          onToggleQr={onToggleQr}
          onToggleQueueOverlay={onToggleQueueOverlay}
          onToggleShowRoomCode={onToggleShowRoomCode}
          isVisible={isVisible}
          canEditRoom={canEditRoom}
          onSubmitMessage={onSubmitMessage}
          roomMode={roomMode}
          partyDate={partyDate}
          partyLocation={partyLocation}
          partyDescription={partyDescription}
        />
      )}

      {leftPanel === 'proposals' && (
        <ProposalsPanel
          room={room}
          suggestions={suggestions}
          showThumbnails={showThumbnails}
          removeVotingProposal={removeVotingProposal}
          approveSuggestion={approveSuggestion}
          rejectSuggestion={rejectSuggestion}
          canEditRoom={canEditRoom}
          onCreateRoomFromYt={onCreateRoomFromYt}
          onAddYtToRoom={onAddYtToRoom}
          ownedRooms={ownedRooms}
          newSongUrl={newSongUrl}
          handleSongUrlChange={handleSongUrlChange}
          handleUrlBlur={handleUrlBlur}
          addSongByUrl={addSongByUrl}
          songSearchSuggestions={songSearchSuggestions}
          selectSuggestion={selectSuggestion}
          clearSuggestions={clearSuggestions}
          newSongTitle={newSongTitle}
          fetchingTitle={fetchingTitle}
          urlErr={urlErr}
        />
      )}
    </aside>
    {leftPanel && (
      <div className="sidebar-resize-handle" onMouseDown={handleResizeMouseDown} />
    )}
    </>
  )
}
