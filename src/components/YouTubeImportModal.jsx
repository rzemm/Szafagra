import { ScrollText } from './ScrollText'
import { useLanguage } from '../context/useLanguage'
import { useYouTubePlaylistImport } from '../hooks/useYouTubePlaylistImport'

export function YouTubeImportModal({ accessToken, onClose, onImportAllSongs, existingYtIds = new Set() }) {
  const { t } = useLanguage()
  const {
    busy,
    handleBack,
    handleImportAll,
    handleImportAllDirect,
    handleImportSelected,
    handleLoadMore,
    handleSelect,
    importingPlaylistId,
    isLikedView,
    likedPlaylist,
    likedTotalCount,
    loadingMore,
    loadingPlaylists,
    loadingSongs,
    nextPageToken,
    playlists,
    playlistsError,
    regularPlaylists,
    selected,
    selectedSongIds,
    songs,
    songsError,
    toggleSongSelection,
  } = useYouTubePlaylistImport({
    accessToken,
    onClose,
    onImportAllSongs,
  })

  const countLabel = isLikedView
    ? likedTotalCount != null ? ` (${likedTotalCount})` : songs != null ? ` (${songs.length}${nextPageToken ? '+' : ''})` : ''
    : selected != null ? (selected.itemCount != null ? ` (${selected.itemCount})` : songs != null ? ` (${songs.length}${nextPageToken ? '+' : ''})` : '') : ''

  const headerTitle = selected
    ? isLikedView
      ? `${t('ytImportFromLiked')}${countLabel}`
      : `${selected.title}${countLabel}`
    : t('ytImportTitle')

  return (
    <div className="ytimport-overlay" role="presentation" onClick={onClose}>
      <div
        className="ytimport-modal"
        role="dialog"
        aria-modal="true"
        aria-label={headerTitle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ytimport-header">
          <span className="ytimport-title">{headerTitle}</span>
          <button className="ytimport-close" onClick={onClose} aria-label={t('closeModal')}>&#x2715;</button>
        </div>

        <div className="ytimport-body">
          {selected ? (
            <div className="ytimport-detail">
              <div className="ytimport-detail-nav">
                <button className="ytimport-back" onClick={handleBack}>
                  {'\u2190'} {t('ytImportBack')}
                </button>
                {selectedSongIds.size > 0 && (
                  <button
                    className="ytimport-action-btn ytimport-action-btn--primary ytimport-import-selected-btn"
                    onClick={handleImportSelected}
                    disabled={busy}
                  >
                    {t('ytImportSelected', selectedSongIds.size)}
                  </button>
                )}
              </div>

              {loadingSongs && (
                <div className="ytimport-status">{t('ytImportFetchingSongs')}</div>
              )}
              {songsError && (
                <div className="ytimport-error">{songsError}</div>
              )}

              {songs && songs.length === 0 && (
                <div className="ytimport-status">{t('ytImportEmpty')}</div>
              )}

              {songs && songs.length > 0 && (
                <>
                  {!isLikedView && onImportAllSongs && (
                    <button className="ytimport-action-btn" onClick={handleImportAll} disabled={busy}>
                      {busy ? '...' : t('ytImportAll')}
                    </button>
                  )}
                  <div className="ytimport-songs-list">
                    {songs.map((song) => (
                      <button
                        key={song.ytId}
                        className={`song-item song-item-clickable${selectedSongIds.has(song.ytId) ? ' song-item--selected' : ''}${existingYtIds.has(song.ytId) ? ' song-item--exists' : ''}`}
                        onClick={() => !existingYtIds.has(song.ytId) && toggleSongSelection(song.ytId)}
                        disabled={busy}
                      >
                        <img src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`} alt="" className="song-thumb" />
                        <div className="song-title-col">
                          <ScrollText className="song-title">{song.title}</ScrollText>
                        </div>
                      </button>
                    ))}
                  </div>
                  {nextPageToken && (
                    <button className="ytimport-action-btn ytimport-action-btn--subtle" onClick={handleLoadMore} disabled={loadingMore}>
                      {loadingMore ? '...' : t('loadMore')}
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {loadingPlaylists && (
                <div className="ytimport-status">{t('ytImportLoading')}</div>
              )}
              {playlistsError && (
                <div className="ytimport-error">{playlistsError}</div>
              )}
              {playlists && playlists.length === 0 && (
                <div className="ytimport-status">{t('ytImportNoPlaylists')}</div>
              )}
              {playlists && playlists.length > 0 && (
                <ul className="ytimport-list">
                  {likedPlaylist && (
                    <li
                      key={likedPlaylist.id}
                      className="ytimport-item"
                      onClick={() => handleSelect(likedPlaylist)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => event.key === 'Enter' && handleSelect(likedPlaylist)}
                    >
                      {likedPlaylist.thumbnail ? (
                        <img src={likedPlaylist.thumbnail} alt="" className="ytimport-thumb" />
                      ) : (
                        <div className="ytimport-thumb ytimport-thumb--empty" />
                      )}
                      <div className="ytimport-item-info">
                        <div className="ytimport-item-title">{t('ytLikedVideos')}</div>
                        <div className="ytimport-item-count">
                          {likedPlaylist.itemCount != null ? `${likedPlaylist.itemCount} ${t('ytImportVideos')}` : ''}
                        </div>
                      </div>
                    </li>
                  )}
                  {likedPlaylist && regularPlaylists.length > 0 && (
                    <li className="ytimport-list-separator" aria-hidden="true">
                      {t('ytImportPlaylists')}
                    </li>
                  )}
                  {regularPlaylists.map((playlist) => (
                    <li
                      key={playlist.id}
                      className="ytimport-item"
                      onClick={() => handleSelect(playlist)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => event.key === 'Enter' && handleSelect(playlist)}
                    >
                      {playlist.thumbnail ? (
                        <img src={playlist.thumbnail} alt="" className="ytimport-thumb" />
                      ) : (
                        <div className="ytimport-thumb ytimport-thumb--empty" />
                      )}
                      <div className="ytimport-item-info">
                        <div className="ytimport-item-title">{playlist.title}</div>
                        <div className="ytimport-item-count">
                          {playlist.itemCount != null ? `${playlist.itemCount} ${t('ytImportVideos')}` : ''}
                        </div>
                      </div>
                      {onImportAllSongs && (
                        <button
                          className="ytimport-item-import-btn"
                          onClick={(event) => handleImportAllDirect(playlist, event)}
                          disabled={!!importingPlaylistId}
                        >
                          {importingPlaylistId === playlist.id ? '...' : t('ytImportAllList')}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
