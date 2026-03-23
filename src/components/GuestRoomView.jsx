import { GuestView } from './GuestView'

export function GuestRoomView({ allowGuestListening = true, submitPlaylistSuggestion, ...props }) {
  return (
    <div className="player-area">
      <GuestView allowGuestListening={allowGuestListening} submitPlaylistSuggestion={submitPlaylistSuggestion} {...props} />
    </div>
  )
}
