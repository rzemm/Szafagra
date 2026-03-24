export function GuestListTab({
  listSearch,
  setListSearch,
  allSongs,
  allowSuggestFromList,
  submitVotingProposal,
  myProposal,
  myProposedIds,
  handleSuggestFromList,
  showThumbs,
  t,
}) {
  return (
    <div className="guest-tab-panel">
      <div className="guest-list">
        <div className="guest-list-search-row">
          <input
            className="guest-list-search"
            value={listSearch}
            onChange={(event) => setListSearch(event.target.value)}
            placeholder={t('listSearchPlaceholder')}
          />
          {listSearch && (
            <button className="guest-list-search-clear" onClick={() => setListSearch('')}>×</button>
          )}
        </div>
        {allSongs.length === 0 ? (
          <p className="guest-list-empty">{t('listEmpty')}</p>
        ) : (
          <>
            <p className="guest-list-count">{t('listCount', allSongs.length)}</p>
            <ul className="guest-list-songs">
              {allSongs.map(({ song }) => {
                const isMyProposal = allowSuggestFromList === true
                  ? myProposedIds.has(song.id)
                  : myProposal?.id === song.id
                const showBtn = allowSuggestFromList && submitVotingProposal
                  && (allowSuggestFromList === true || !myProposal || isMyProposal)

                return (
                  <li key={song.id} className={`guest-list-song${isMyProposal ? ' proposed' : ''}`}>
                    {showThumbs && (
                      <img
                        src={`https://img.youtube.com/vi/${song.ytId}/default.jpg`}
                        alt=""
                        className="guest-list-thumb"
                      />
                    )}
                    <span className="guest-list-title">{song.title}</span>
                    {showBtn && (
                      <button
                        className={`guest-list-suggest-btn${isMyProposal ? ' sent' : ''}`}
                        onClick={() => !isMyProposal && handleSuggestFromList(song)}
                        title={isMyProposal ? t('myProposal') : t('proposeForVote')}
                      >
                        {isMyProposal ? '✓' : '+'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
