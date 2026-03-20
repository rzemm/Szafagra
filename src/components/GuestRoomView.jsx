import { GuestView } from './GuestView'

export function GuestRoomView(props) {
  return (
    <div className="player-area">
      <GuestView {...props} />
    </div>
  )
}
