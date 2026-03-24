import { useCallback, useRef } from 'react'

export function useOwnerGestures(ui) {
  const dragStart = useRef(null)

  const handlePointerDown = useCallback((event) => {
    if (event.target.closest('button, input, select, a, label, [role="button"], .qr-clickable')) return
    dragStart.current = { x: event.clientX, y: event.clientY }
  }, [])

  const handlePointerUp = useCallback((event) => {
    if (!dragStart.current) return

    if (event.target.closest('button, input, select, a, label, [role="button"], .qr-clickable')) {
      dragStart.current = null
      return
    }

    const dx = event.clientX - dragStart.current.x
    const dy = dragStart.current.y - event.clientY
    dragStart.current = null

    const threshold = 40
    const isSwipeRight = dx > threshold && dx > Math.abs(dy)
    const isSwipeUp = dy > threshold && dy > Math.abs(dx)
    const isClick = Math.abs(dx) < 15 && Math.abs(dy) < 15

    if (isSwipeRight) {
      if (ui.leftPanel) {
        ui.toggleLeftPanel(ui.leftPanel)
      } else {
        if (ui.panelOpen.voting) ui.togglePanel('voting')
        ui.toggleLeftPanel('songs')
      }
      return
    }

    if (isSwipeUp) {
      if (ui.panelOpen.voting) {
        ui.togglePanel('voting')
      } else {
        if (ui.leftPanel) ui.toggleLeftPanel(ui.leftPanel)
        ui.togglePanel('voting')
      }
      return
    }

    if (isClick) {
      const anyOpen = ui.leftPanel || ui.panelOpen.voting
      if (anyOpen) {
        if (ui.leftPanel) ui.toggleLeftPanel(ui.leftPanel)
        if (ui.panelOpen.voting) ui.togglePanel('voting')
      } else {
        ui.toggleLeftPanel('songs')
      }
    }
  }, [ui])

  return { handlePointerDown, handlePointerUp }
}
