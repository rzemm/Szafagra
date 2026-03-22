import { useCallback, useEffect, useReducer, useState } from 'react'

const initialUiState = {
  newSongUrl: '',
  newSongTitle: '',
  urlErr: '',
  fetchingTitle: false,
  ytPlaylistId: null,
  importingYtPlaylist: false,
  editingId: null,
  editingName: '',
  copied: null,
  collapsed: { settings: true, songs: false, suggestions: false },
  uiError: '',
}

function uiReducer(state, action) {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value }
    case 'toggleSection': {
      const isCurrentlyOpen = !state.collapsed[action.key]
      const allClosed = { settings: true, songs: true, suggestions: true }
      return {
        ...state,
        collapsed: isCurrentlyOpen
          ? allClosed
          : { ...allClosed, [action.key]: false },
      }
    }
    case 'startPlaylistEdit':
      return { ...state, editingId: action.playlistId, editingName: action.name }
    case 'cancelPlaylistEdit':
      return { ...state, editingId: null, editingName: '' }
    case 'setUrlInput':
      return { ...state, newSongUrl: action.value, urlErr: '' }
    case 'songTitleFetchStart':
      return { ...state, fetchingTitle: true, urlErr: '' }
    case 'songTitleFetchEnd':
      return { ...state, fetchingTitle: false }
    case 'songAdded':
      return { ...state, newSongUrl: '', newSongTitle: '', urlErr: '' }
    default:
      return state
  }
}

export function useRoomUiState() {
  const [uiState, dispatch] = useReducer(uiReducer, initialUiState)
  const [panelOpen, setPanelOpen] = useState({ qr: true, voting: false, showQueue: true, showRoomCode: false })
  const [leftPanel, setLeftPanel] = useState('songs')
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [copyingRoom, setCopyingRoom] = useState(false)
  const [appendingRoom, setAppendingRoom] = useState(false)
  const [localCurrentSongId, setLocalCurrentSongId] = useState(null)

  useEffect(() => {
    if (!uiState.copied) return
    const timeoutId = setTimeout(() => {
      dispatch({ type: 'setField', field: 'copied', value: null })
    }, 2500)
    return () => clearTimeout(timeoutId)
  }, [uiState.copied])

  const setField = useCallback((field, value) => {
    dispatch({ type: 'setField', field, value })
  }, [])

  const toggleSection = useCallback((key) => {
    dispatch({ type: 'toggleSection', key })
  }, [])

  const toggleLeftPanel = useCallback((panel) => {
    setLeftPanel((current) => current === panel ? null : panel)
  }, [])

  const startEditPlaylist = useCallback((playlistId, name) => {
    dispatch({ type: 'startPlaylistEdit', playlistId, name })
  }, [])

  const cancelEditPlaylist = useCallback(() => {
    dispatch({ type: 'cancelPlaylistEdit' })
  }, [])

  const handleSongUrlChange = useCallback((value) => {
    dispatch({ type: 'setUrlInput', value })
  }, [])

  const togglePanel = useCallback((key) => {
    setPanelOpen((current) => ({ ...current, [key]: !current[key] }))
  }, [])

  return {
    uiState,
    dispatch,
    setField,
    toggleSection,
    leftPanel,
    toggleLeftPanel,
    panelOpen,
    togglePanel,
    creatingRoom,
    setCreatingRoom,
    copyingRoom,
    setCopyingRoom,
    appendingRoom,
    setAppendingRoom,
    localCurrentSongId,
    setLocalCurrentSongId,
    startEditPlaylist,
    cancelEditPlaylist,
    handleSongUrlChange,
  }
}
