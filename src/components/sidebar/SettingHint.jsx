import { useState } from 'react'

export function SettingHint({ text, onClick }) {
  const [open, setOpen] = useState(false)

  if (onClick) {
    return (
      <span className="setting-hint">
        <button
          type="button"
          className="setting-hint-btn"
          onClick={(e) => { e.stopPropagation(); onClick() }}
        >
          ?
        </button>
      </span>
    )
  }

  return (
    <span className="setting-hint">
      <button
        type="button"
        className="setting-hint-btn"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && <span className="setting-hint-tooltip">{text}</span>}
    </span>
  )
}
