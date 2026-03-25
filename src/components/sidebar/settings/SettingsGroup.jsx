import { SettingHint } from '../SettingHint'

export function SettingsGroup({ title, isOpen, onToggle, onHelp, children }) {
  return (
    <div className="settings-group">
      <span className="settings-group-title settings-group-title--clickable" onClick={onToggle}>
        {title} <SettingHint onClick={onHelp} />
        <span className="settings-group-arrow">{isOpen ? '\u25be' : '\u25b8'}</span>
      </span>

      {isOpen && children}
    </div>
  )
}
