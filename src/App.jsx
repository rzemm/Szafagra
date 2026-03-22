import { HomePage } from './components/HomePage'
import {
  CookieConsentBanner,
  CookieSettingsModal,
} from './components/CookieConsent'
import { GuestRoomView } from './components/GuestRoomView'
import { OwnerRoomView } from './components/OwnerRoomView'
import { RoomHeader } from './components/RoomHeader'
import { useConsentManager } from './hooks/useConsentManager'
import { useRoomRoute } from './hooks/useRoomRoute'
import { useRoomScreen } from './hooks/useRoomScreen'
import { useLanguage } from './context/LanguageContext'
import './App.css'

function SplashScreen({ message }) {
  return <div className="splash"><div className="splash-icon">🎵</div><p>{message}</p></div>
}

export default function App() {
  const route = useRoomRoute()
  const screen = useRoomScreen(route)
  const consent = useConsentManager()
  const { t } = useLanguage()

  if (!screen.authReady) {
    return <SplashScreen message={t('connecting')} />
  }

  let content

  if (!route.hasRoomParam) {
    content = (
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
        onOpenCookieSettings={consent.openSettings}
      />
    )
  } else if (screen.roomError) {
    content = <SplashScreen message={screen.roomError} />
  } else if (!screen.room) {
    content = <SplashScreen message={t('loadingRoom')} />
  } else {
    content = (
      <>
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
          searchSuggestions={screen.songActions.suggestions}
          selectSuggestion={screen.songActions.selectSuggestion}
          clearSuggestions={screen.songActions.clearSuggestions}
          newSongTitle={screen.uiState.newSongTitle}
          fetchingTitle={screen.uiState.fetchingTitle}
          urlErr={screen.uiState.urlErr}
          room={screen.room}
          user={screen.auth.user}
          signInWithGoogle={screen.auth.signInWithGoogle}
          signOutUser={screen.auth.signOutUser}
          updateDisplayName={screen.auth.updateDisplayName}
          onShareGuestLink={screen.shareLinks.copyVoterLink}
          guestCopied={screen.uiState.copied === 'voter'}
          suggestions={screen.suggestions}
          onOpenCookieSettings={consent.openSettings}
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
              replaceSong={screen.replaceSong}
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
      </>
    )
  }

  return (
    <div className="app">
      {content}

      {consent.isBannerVisible && (
        <CookieConsentBanner
          onAcceptAll={consent.acceptAll}
          onRejectOptional={consent.rejectOptional}
          onOpenSettings={consent.openSettings}
        />
      )}
      <CookieSettingsModal
        consentState={consent.consentState}
        isOpen={consent.isSettingsOpen}
        onClose={consent.closeSettings}
        onAcceptAll={consent.acceptAll}
        onRejectOptional={consent.rejectOptional}
        onSavePreferences={consent.savePreferences}
        onOpenSettings={consent.openSettingsLink}
      />
    </div>
  )
}
