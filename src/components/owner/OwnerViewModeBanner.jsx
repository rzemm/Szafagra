import { useState } from 'react'

export function OwnerViewModeBanner({ isViewMode, viewMode, t }) {
  const [appendTargetId, setAppendTargetId] = useState('')
  const [appendDone, setAppendDone] = useState(false)

  if (!isViewMode) return null

  const handleAppend = async () => {
    if (!appendTargetId) return
    await viewMode.handleAppendToRoom(appendTargetId)
    setAppendDone(true)
    setTimeout(() => setAppendDone(false), 3000)
  }

  return (
    <div className="view-mode-banner">
      <span className="view-mode-label">{t('viewModeLabel')}</span>
      <button
        className="view-mode-copy-btn"
        onClick={viewMode.handleCopyRoom}
        disabled={viewMode.copyingRoom}
      >
        {viewMode.copyingRoom ? t('copying') : t('copyThisList')}
      </button>
      {viewMode.ownedRooms?.length > 0 && (
        <div className="view-mode-append-row">
          <select
            className="view-mode-append-select"
            value={appendTargetId}
            onChange={(event) => {
              setAppendTargetId(event.target.value)
              setAppendDone(false)
            }}
          >
            <option value="">{t('appendSongsTo')}</option>
            {viewMode.ownedRooms.map((ownedRoom) => (
              <option key={ownedRoom.id} value={ownedRoom.id}>
                {ownedRoom.name || t('privateRoom')}
              </option>
            ))}
          </select>
          {appendTargetId && (
            <button
              className="view-mode-append-btn"
              onClick={handleAppend}
              disabled={viewMode.appendingRoom || appendDone}
            >
              {appendDone
                ? t('appended')
                : viewMode.appendingRoom
                  ? t('appending')
                  : t('append')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
