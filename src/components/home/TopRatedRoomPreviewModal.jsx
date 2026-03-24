import { useState } from 'react'

export function TopRatedRoomPreviewModal({
  room,
  ownedRooms,
  isLoggedIn,
  t,
  onClose,
  onPreviewRoom,
  onCopyForeignRoom,
  onAppendForeignToRoom,
}) {
  const [previewBusy, setPreviewBusy] = useState(false)
  const [appendRoomId, setAppendRoomId] = useState('')

  return (
    <div className="room-preview-overlay" role="presentation" onClick={onClose}>
      <div className="room-preview-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="room-preview-header">
          <div className="room-preview-header-info">
            <span className="room-preview-title">{room.name || t('defaultRoomName')}</span>
            <span className="room-preview-count">{t('songCount', room.songs?.length ?? 0)}</span>
          </div>
          <button className="room-preview-close" onClick={onClose}>×</button>
        </div>

        <div className="room-preview-songs">
          {(room.songs ?? []).map((song, index) => (
            <div key={song.id ?? index} className="room-preview-song">
              <span className="room-preview-song-num">{index + 1}</span>
              <span className="room-preview-song-title">{song.title}</span>
            </div>
          ))}
        </div>

        <div className="room-preview-actions">
          <button
            className="room-preview-btn room-preview-btn--enter"
            onClick={() => {
              onClose()
              onPreviewRoom(room.id)
            }}
          >
            {t('enterRoom')}
          </button>
          {isLoggedIn && (
            <>
              <button
                className="room-preview-btn room-preview-btn--copy"
                disabled={previewBusy}
                onClick={async () => {
                  setPreviewBusy(true)
                  await onCopyForeignRoom(room)
                  setPreviewBusy(false)
                  onClose()
                }}
              >
                {previewBusy ? t('creating') : t('copyToNew')}
              </button>
              {ownedRooms.length > 0 && (
                <div className="room-preview-append-row">
                  <select
                    className="room-preview-append-select"
                    value={appendRoomId}
                    onChange={(event) => setAppendRoomId(event.target.value)}
                    disabled={previewBusy}
                  >
                    <option value="">{t('addTo')}</option>
                    {ownedRooms.map((ownedRoom) => (
                      <option key={ownedRoom.id} value={ownedRoom.id}>
                        {ownedRoom.name || t('privateRoom')}
                      </option>
                    ))}
                  </select>
                  {appendRoomId && (
                    <button
                      className="room-preview-btn room-preview-btn--copy"
                      disabled={previewBusy}
                      onClick={async () => {
                        setPreviewBusy(true)
                        await onAppendForeignToRoom(appendRoomId, room.songs ?? [])
                        setPreviewBusy(false)
                        onClose()
                      }}
                    >
                      {previewBusy ? t('creating') : '+ Dodaj'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
