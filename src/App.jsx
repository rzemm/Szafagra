import { HomePage } from './components/HomePage'
import { GuestRoomView } from './components/GuestRoomView'
import { OwnerRoomView } from './components/OwnerRoomView'
import { RoomHeader } from './components/RoomHeader'
import { useRoomRoute } from './hooks/useRoomRoute'
import { useRoomScreen } from './hooks/useRoomScreen'
import './App.css'

function SplashScreen({ message }) {
  return <div className="splash"><div className="splash-icon">🎵</div><p>{message}</p></div>
}

export default function App() {
  const route = useRoomRoute()
  const screen = useRoomScreen(route)

  if (!screen.authReady) {
    return <SplashScreen message="Laczenie..." />
  }

  if (!route.hasRoomParam) {
    return (
      <HomePage
        creatingRoom={screen.creatingRoom}
        user={screen.auth.user}
        ownedRooms={screen.ownedRooms}
        latestForeignRooms={screen.latestForeignRooms}
        onCreateRoom={screen.handleCreateRoom}
        onDeleteRoom={screen.handleDeleteRoom}
        onJoinRoom={screen.handleJoinRoom}
        onPreviewRoom={(roomId) => route.navigateToRoom(roomId, { previewMode: true })}
        onSeedRooms={screen.handleSeedRooms}
        onSignIn={screen.auth.signInWithGoogle}
        onSignOut={screen.auth.signOutUser}
      />
    )
  }

  if (screen.roomError) {
    return <SplashScreen message={screen.roomError} />
  }

  if (!screen.room) {
    return <SplashScreen message="Ladowanie szafy..." />
  }

  return (
    <div className="app">
      {screen.uiState.uiError && <div className="error-banner">{screen.uiState.uiError}</div>}
      <RoomHeader
        showOwnerUI={screen.showOwnerUI}
        canEditRoom={screen.canEditRoom}
        leftPanel={screen.leftPanel}
        toggleLeftPanel={screen.toggleLeftPanel}
        newSongUrl={screen.uiState.newSongUrl}
        setNewSongUrl={screen.handleSongUrlChange}
        handleUrlBlur={screen.songActions.handleUrlBlur}
        addSong={screen.songActions.addSong}
        newSongTitle={screen.uiState.newSongTitle}
        fetchingTitle={screen.uiState.fetchingTitle}
        urlErr={screen.uiState.urlErr}
        room={screen.room}
        user={screen.auth.user}
        signInWithGoogle={screen.auth.signInWithGoogle}
        signOutUser={screen.auth.signOutUser}
        onShareGuestLink={screen.shareLinks.copyVoterLink}
        guestCopied={screen.uiState.copied === 'voter'}
        suggestions={screen.suggestions}
      />

      <main className="main">
        {screen.showOwnerUI ? (
          <OwnerRoomView
            canEditRoom={screen.canEditRoom}
            roomType={screen.auth.roomType}
            leftPanel={screen.leftPanel}
            panelOpen={screen.panelOpen}
            togglePanel={screen.togglePanel}
            room={screen.room}
            currentSong={screen.currentSong}
            isPlaying={screen.isPlaying}
            remaining={screen.remaining}
            ytPlayerState={screen.ytPlayerState}
            loadProgress={screen.loadProgress}
            playerRef={screen.playerRef}
            playerDivRef={screen.playerDivRef}
            playerReady={screen.playerReady}
            advanceToWinner={screen.advanceToWinner}
            skipThreshold={screen.skipThreshold}
            skipCount={screen.skipCount}
            startJukebox={screen.startJukebox}
            stopJukebox={screen.stopJukebox}
            voteMode={screen.voteMode}
            queue={screen.queue}
            voteThreshold={screen.voteThreshold}
            saveSettings={screen.saveSettings}
            suggestions={screen.suggestions}
            showThumbnails={screen.showThumbnails}
            playlistActions={screen.playlistActions}
            songActions={screen.songActions}
            settings={screen.settings}
            nextOptionKeys={screen.nextOptionKeys}
            nextOptions={screen.nextOptions}
            nextVotesData={screen.nextVotesData}
            userId={screen.userId}
            vote={screen.vote}
            playSongNow={screen.playSongNow}
            queueSong={screen.queueSong}
            removeVotingOption={screen.removeVotingOption}
            advanceToOption={screen.advanceToOption}
            shareLinks={screen.shareLinks}
            copied={screen.uiState.copied}
            renameRoom={screen.renameRoom}
            isVisible={screen.isVisible}
            isViewMode={route.isViewMode}
            handleCopyRoom={screen.handleCopyRoom}
            copyingRoom={screen.copyingRoom}
            handleAppendToRoom={screen.handleAppendToRoom}
            appendingRoom={screen.appendingRoom}
            ownedRooms={screen.ownedRooms}
            approveSuggestion={screen.approveSuggestion}
            rejectSuggestion={screen.rejectSuggestion}
            removeFromQueue={screen.removeFromQueue}
            localCurrentSongId={screen.localCurrentSongId}
            handleLocalPlay={screen.handleLocalPlay}
            uiState={screen.uiState}
            setField={screen.setField}
            toggleSection={screen.toggleSection}
            startEditPlaylist={screen.startEditPlaylist}
            cancelEditPlaylist={screen.cancelEditPlaylist}
            onSubmitMessage={screen.submitContactMessage}
          />
        ) : (
          <GuestRoomView
            isOwner={screen.auth.isOwner}
            playerDivRef={screen.playerDivRef}
            isPlaying={screen.isPlaying}
            currentSong={screen.currentSong}
            remaining={screen.remaining}
            queue={screen.queue}
            nextOptionKeys={screen.nextOptionKeys}
            nextOptions={screen.nextOptions}
            nextVotesData={screen.nextVotesData}
            userId={screen.userId}
            vote={screen.vote}
            skipThreshold={screen.skipThreshold}
            mySkipVote={screen.mySkipVote}
            voteSkip={screen.voteSkip}
            allowSuggestions={screen.settings.allowSuggestions ?? true}
            allowGuestListening={screen.settings.allowGuestListening ?? false}
            tickerText={screen.settings.tickerText ?? ''}
            tickerForGuests={screen.settings.tickerForGuests ?? false}
            submitSuggestion={screen.submitSuggestion}
            myRating={screen.myRating}
            onRate={screen.rateActivePlaylist}
            showThumbnails={screen.showThumbnails}
            jukeboxState={screen.room}
            onSubmitMessage={screen.submitContactMessage}
          />
        )}
      </main>
    </div>
  )
}
