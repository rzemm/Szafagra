import { GuestView } from './GuestView'

export function GuestRoomView({ submitPlaylistSuggestion, ...props }) {
  return (
    <div className="player-area">
      <GuestView submitPlaylistSuggestion={submitPlaylistSuggestion} {...props} />
    </div>
  )
}
