import { useCallback, useMemo } from 'react'

export function useShareLinks({ roomId, guestToken, onCopied }) {
  const voterUrl = useMemo(() => {
    if (!guestToken) return null

    const url = new URL(window.location.origin + window.location.pathname)
    url.searchParams.set('room', guestToken)
    return url.toString()
  }, [guestToken])

  const copyAdminLink = useCallback(() => {
    const url = new URL(window.location.origin + window.location.pathname)
    url.searchParams.set('room', roomId ?? '')
    navigator.clipboard.writeText(url.toString()).then(() => onCopied('admin'))
  }, [onCopied, roomId])

  const copyVoterLink = useCallback(() => {
    if (!voterUrl) return
    navigator.clipboard.writeText(voterUrl).then(() => onCopied('voter'))
  }, [onCopied, voterUrl])

  return {
    voterUrl,
    copyAdminLink,
    copyVoterLink,
  }
}
