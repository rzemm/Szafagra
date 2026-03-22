import { useState } from 'react'

function formatNoteTitle(count) {
  if (count === 1) return '1 utwór w grupie'
  if (count < 5) return `${count} utwory w grupie`
  return `${count} utworów w grupie`
}

export function NotePicker({ value, onChange, max = 5 }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="note-picker-notes">
      {Array.from({ length: max }, (_, index) => index + 1).map((noteValue) => (
        <button
          key={noteValue}
          className={`note-icon-btn${(hover ? hover >= noteValue : value >= noteValue) ? ' active' : ''}`}
          onClick={() => onChange(noteValue)}
          onMouseEnter={() => setHover(noteValue)}
          onMouseLeave={() => setHover(0)}
          title={formatNoteTitle(noteValue)}
        >
          ♪
        </button>
      ))}
    </div>
  )
}
