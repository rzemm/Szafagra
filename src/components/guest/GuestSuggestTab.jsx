import { ScrollText } from '../ScrollText'

export function GuestSuggestTab({
  allowSuggestions,
  allowSuggestFromList,
  submitPlaylistSuggestion,
  suggestion,
  playlist,
  ytAuth,
  t,
}) {
  if (!allowSuggestions) {
    return <div className="guest-tab-panel" />
  }

  return (
    <div className="guest-tab-panel">
      <div className="guest-suggest">
        <p className="guest-suggest-label">{t('suggestSong')}</p>
        {suggestion.submitted ? (
          <p className="guest-suggest-ok">{t('suggestionSent')}</p>
        ) : (
          <>
            <div className="song-input-wrapper">
              <input
                className="guest-suggest-input"
                value={suggestion.suggestUrl}
                onChange={(event) => {
                  suggestion.setSuggestUrl(event.target.value)
                  suggestion.setSuggestTitle('')
                  suggestion.setSuggestErr('')
                  suggestion.setSuggestSearchResults([])
                }}
                onBlur={suggestion.handleSuggestBlur}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') suggestion.setSuggestSearchResults([])
                }}
                placeholder={t('suggestPlaceholder')}
              />
              {suggestion.suggestSearchResults.length > 0 && (
                <ul className="song-suggestions-dropdown">
                  {suggestion.suggestSearchResults.map((item) => (
                    <li
                      key={item.ytId}
                      className="song-suggestion-item"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => suggestion.handleSelectSuggestion(item)}
                    >
                      {item.thumbnail && <img src={item.thumbnail} className="suggestion-thumb" alt="" />}
                      <ScrollText className="suggestion-title">{item.title}</ScrollText>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {suggestion.fetchingTitle && <p className="guest-suggest-hint">{t('fetchingTitleShort')}</p>}
            {suggestion.suggestTitle && <p className="guest-suggest-hint">{suggestion.suggestTitle}</p>}
            {suggestion.suggestErr && <p className="guest-suggest-err">{suggestion.suggestErr}</p>}
            <button
              className="guest-suggest-btn"
              onClick={suggestion.handleSubmitSuggestion}
              disabled={!suggestion.suggestTitle || suggestion.submitting}
            >
              {suggestion.submitting ? '...' : t('suggestBtn')}
            </button>
          </>
        )}
      </div>

      {submitPlaylistSuggestion && (
        <div className="guest-suggest">
          {playlist.submittedPlaylist ? (
            <p className="guest-suggest-ok">{t('suggestPlaylistSent')}</p>
          ) : !ytAuth.accessToken ? (
            <>
              <p className="guest-suggest-playlist-desc">{t('suggestPlaylistDesc')}</p>
              <button className="guest-suggest-yt-btn" onClick={ytAuth.connect} disabled={ytAuth.connecting}>
                {ytAuth.connecting ? t('suggestPlaylistConnecting') : t('suggestPlaylistConnect')}
              </button>
              {ytAuth.error && <p className="guest-suggest-err">{ytAuth.error}</p>}
            </>
          ) : (
            <>
              <div className="guest-suggest-yt-header">
                <button className="guest-suggest-yt-disconnect" onClick={ytAuth.disconnect}>{t('suggestPlaylistDisconnect')}</button>
              </div>
              {playlist.loadingPlaylists && <p className="guest-suggest-hint">{t('suggestPlaylistLoading')}</p>}
              {!playlist.loadingPlaylists && playlist.playlists && playlist.playlists.length === 0 && (
                <p className="guest-suggest-hint">{t('suggestPlaylistNoPlaylists')}</p>
              )}
              {!playlist.selectedPlaylist && playlist.playlists && playlist.playlists.length > 0 && (
                <>
                  <p className="guest-suggest-hint">{t('suggestPlaylistSelect')}</p>
                  <ul className="guest-playlist-list">
                    {playlist.playlists.map((item) => (
                      <li key={item.id} className="guest-playlist-item" onClick={() => playlist.handleSelectPlaylist(item)}>
                        {item.thumbnail && <img src={item.thumbnail} alt="" className="guest-playlist-thumb" />}
                        <div className="guest-playlist-info">
                          <span className="guest-playlist-title">{item.title}</span>
                          <span className="guest-playlist-count">{item.itemCount} {t('suggestPlaylistVideos')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {playlist.selectedPlaylist && (
                <div className="guest-playlist-selected">
                  <button className="guest-playlist-back" onClick={playlist.resetSelectedPlaylist}>
                    ← {t('suggestPlaylistBack')}
                  </button>
                  <div className="guest-playlist-selected-info">
                    {playlist.selectedPlaylist.thumbnail && <img src={playlist.selectedPlaylist.thumbnail} alt="" className="guest-playlist-thumb" />}
                    <div>
                      <span className="guest-playlist-title">{playlist.selectedPlaylist.title}</span>
                      {playlist.loadingPlaylistSongs && <p className="guest-suggest-hint">{t('suggestPlaylistFetching')}</p>}
                      {playlist.playlistSongs && <p className="guest-suggest-hint">{t('suggestPlaylistSongCount', playlist.playlistSongs.length)}</p>}
                    </div>
                  </div>
                  {playlist.playlistSongs && playlist.playlistSongs.length > 0 && (
                    <button className="guest-suggest-btn" onClick={playlist.handleSubmitPlaylist} disabled={playlist.submittingPlaylist}>
                      {playlist.submittingPlaylist ? '...' : t('suggestPlaylistSubmit')}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
