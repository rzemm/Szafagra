import { useCallback, useEffect, useRef, useState } from 'react'
import { SongsPanel } from './sidebar/SongsPanel'
import { SettingsPanel } from './sidebar/SettingsPanel'
import { ProposalsPanel } from './sidebar/ProposalsPanel'

export function PlaylistSidebar({ model }) {
  const { ui, songsPanel, settingsPanel, proposalsPanel } = model
  const [sidebarWidth, setSidebarWidth] = useState(360)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(360)

  const handleResizeMouseDown = useCallback((e) => {
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = sidebarWidth
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
  }, [sidebarWidth])

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isResizing.current) return
      const delta = e.clientX - startX.current
      setSidebarWidth(Math.min(600, Math.max(200, startWidth.current + delta)))
    }
    const onMouseUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <>
    <aside
      className={`sidebar${ui.leftPanel ? '' : ' sidebar-hidden'}`}
      style={ui.leftPanel ? { width: sidebarWidth } : undefined}
    >
      {ui.leftPanel === 'songs' && songsPanel.room && (
        <SongsPanel model={songsPanel} />
      )}

      {ui.leftPanel === 'settings' && (
        <SettingsPanel model={settingsPanel} />
      )}

      {ui.leftPanel === 'proposals' && (
        <ProposalsPanel model={proposalsPanel} />
      )}
    </aside>
    {ui.leftPanel && (
      <div className="sidebar-resize-handle" onMouseDown={handleResizeMouseDown} />
    )}
    </>
  )
}
