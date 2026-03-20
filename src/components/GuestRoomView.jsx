import { GuestView } from './GuestView'

export function GuestRoomView({ allowGuestListening = true, ...props }) {
  return (
    <div className="player-area">
      <GuestView allowGuestListening={allowGuestListening} {...props} />
    </div>
  )
}
