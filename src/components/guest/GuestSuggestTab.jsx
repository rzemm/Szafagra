import { ScrollText } from '../ScrollText'

import { YT_LIKED_PLAYLIST_ID } from '../../lib/youtube'

export function GuestSuggestTab({
  allowSuggestions,
  submitPlaylistSuggestion,
  suggestion,
  playlist,
  ytAuth,
  existingYtIds = new Set(),
  t,
}) {
  if (!allowSuggestions) {
    return <div className="guest-tab-panel" />
  }

  const isLikedView = playlist.selectedPlaylist?.id === YT_LIKED_PLAYLIST_ID

  const countLabel = isLikedView
    ? playlist.likedTotalCount != null
      ? ` (${playlist.likedTotalCount})`
      : playlist.playlistSongs != null
        ? ` (${playlist.playlistSongs.length}${playlist.nextPageToken ? '+' : ''})`
        : ''
    : playlist.selectedPlaylist != null
      ? playlist.selectedPlaylist.itemCount != null
        ? ` (${playlist.selectedPlaylist.itemCount})`
        : playlist.playlistSongs != null
          ? ` (${playlist.playlistSongs.length}${playlist.nextPageToken ? '+' : ''})`
          : ''
      : ''

  const detailTitle = playlist.selectedPlaylist
    ? isLikedView
      ? `${t('ytImportFromLiked')}${countLabel}`
      : `${playlist.selectedPlaylist.title}${countLabel}`
    : ''

  const regularPlaylists = playlist.playlists ? playlist.playlists.filter((pl) => pl.id !== YT_LIKED_PLAYLIST_ID) : []
  const likedPlaylist = playlist.playlists ? playlist.playlists.find((pl) => pl.id === YT_LIKED_PLAYLIST_ID) : null

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

              {playlist.loadingPlaylists && (
                <p className="guest-suggest-hint">{t('suggestPlaylistLoading')}</p>
              )}

              {!playlist.loadingPlaylists && playlist.playlists && playlist.playlists.length === 0 && (
                <p className="guest-suggest-hint">{t('suggestPlaylistNoPlaylists')}</p>
              )}

              {!playlist.selectedPlaylist && playlist.playlists && playlist.playlists.length > 0 && (
                <>
                  <p className="guest-suggest-hint">{t('suggestPlaylistSelect')}</p>
                  <ul className="ytimport-list">
                    {likedPlaylist && (
                      <li
                        key={likedPlaylist.id}
                        className="ytimport-item"
                        onClick={() => playlist.handleSelectPlaylist(likedPlaylist)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && playlist.handleSelectPlaylist(likedPlaylist)}
                      >
                        <div className="ytimport-item-info">
                          <div className="ytimport-item-title">{t('ytLikedVideos')}</div>
                          {likedPlaylist.itemCount != null && (
                            <div className="ytimport-item-count">{likedPlaylist.itemCount} {t('suggestPlaylistVideos')}</div>
                          )}
                        </div>
                      </li>
                    )}
                    {likedPlaylist && regularPlaylists.length > 0 && (
                      <li className="ytimport-list-separator" aria-hidden="true">
                        {t('ytImportPlaylists')}
                      </li>
                    )}
                    {regularPlaylists.map((pl) => (
                      <li
                        key={pl.id}
                        className="ytimport-item ytimport-item--with-action"
                        onClick={() => playlist.handleSelectPlaylist(pl)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && playlist.handleSelectPlaylist(pl)}
                      >
                        <div className="ytimport-item-top">
                          {pl.thumbnail
                            ? <img src={pl.thumbnail} alt="" className="ytimport-thumb" />
                            : <div className="ytimport-thumb ytimport-thumb--empty" />
                          }
                          <div className="ytimport-item-info">
                            <div className="ytimport-item-title">{pl.title}</div>
                            {pl.itemCount != null && (
                              <div className="ytimport-item-count">{pl.itemCount} {t('suggestPlaylistVideos')}</div>
                            )}
                          </div>
                        </div>
                        <button
                          className="ytimport-item-import-btn ytimport-item-import-btn--full"
                          onClick={(e) => { e.stopPropagation(); playlist.handleImportAllDirect(pl) }}
                          disabled={!!playlist.importingPlaylistId}
                        >
                          {playlist.importingPlaylistId === pl.id
                            ? (playlist.importProgress ? t('ytImportingProgress', playlist.importProgress.done, playlist.importProgress.total) : '...')
                            : t('ytImportAllList')}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {playlist.selectedPlaylist && (
                <div className="ytimport-detail">
                  <div className="ytimport-detail-nav">
                    <button className="ytimport-back" onClick={playlist.resetSelectedPlaylist}>
                      ← {t('suggestPlaylistBack')}
                    </button>
                    {playlist.selectedSongIds.size > 0 && (
                      <button
                        className="ytimport-action-btn ytimport-action-btn--primary ytimport-import-selected-btn"
                        onClick={playlist.handleImportSelected}
                        disabled={playlist.submittingPlaylist}
                      >
                        {t('ytImportSelected', playlist.selectedSongIds.size)}
                      </button>
                    )}
                  </div>

                  {playlist.importProgress && (
                    <p className="guest-suggest-hint">
                      {t('ytImportingProgress', playlist.importProgress.done, playlist.importProgress.total)}
                    </p>
                  )}

                  <p className="guest-suggest-hint guest-suggest-hint--title">{detailTitle}</p>

                  {playlist.loadingPlaylistSongs && (
                    <p className="guest-suggest-hint">{t('suggestPlaylistFetching')}</p>
                  )}

                  {playlist.playlistSongs && playlist.playlistSongs.length === 0 && (
                    <p className="guest-suggest-hint">{t('ytImportEmpty')}</p>
                  )}

                  {playlist.playlistSongs && playlist.playlistSongs.length > 0 && (
                    <>
                      {!isLikedView && (
                        <button
                          className="ytimport-action-btn"
                          onClick={playlist.handleImportAll}
                          disabled={playlist.submittingPlaylist}
                        >
                          {playlist.importProgress ? '...' : t('ytImportAll')}
                        </button>
                      )}
                      <div className="ytimport-songs-list">
                        {playlist.playlistSongs.map((song) => (
                          <button
                            key={song.ytId}
                            className={`song-item song-item-clickable${playlist.selectedSongIds.has(song.ytId) ? ' song-item--selected' : ''}${existingYtIds.has(song.ytId) ? ' song-item--exists' : ''}`}
                            onClick={() => !existingYtIds.has(song.ytId) && playlist.toggleSongSelection(song.ytId)}
                            disabled={playlist.submittingPlaylist}
                          >
                            <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />
                            <div className="song-title-col">
                              <ScrollText className="song-title">{song.title}</ScrollText>
                            </div>
                          </button>
                        ))}
                      </div>
                      {playlist.nextPageToken && (
                        <button
                          className="ytimport-action-btn ytimport-action-btn--subtle"
                          onClick={playlist.handleLoadMore}
                          disabled={playlist.loadingMore}
                        >
                          {playlist.loadingMore ? '...' : t('loadMore')}
                        </button>
                      )}
                    </>
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
