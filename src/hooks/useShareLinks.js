import { useCallback, useMemo } from 'react'

export function useShareLinks({ roomId, roomType, guestToken, onCopied }) {
  const guestUrl = useMemo(() => {
    if (!guestToken) return null

    const url = new URL(window.location.origin + window.location.pathname)
    url.searchParams.set('room', guestToken)
    return url.toString()
  }, [guestToken])

  const adminUrl = useMemo(() => {
    if (!roomId) return null

    const url = new URL(window.location.origin + window.location.pathname)
    url.searchParams.set('room', roomId)
    return url.toString()
  }, [roomId])

  const copyAdminLink = useCallback(() => {
    const link = roomType === 'public' ? guestUrl : adminUrl
    if (!link) return
    navigator.clipboard.writeText(link).then(() => onCopied('admin'))
  }, [adminUrl, guestUrl, onCopied, roomType])

  const copyVoterLink = useCallback(() => {
    if (!guestUrl) return
    navigator.clipboard.writeText(guestUrl).then(() => onCopied('voter'))
  }, [guestUrl, onCopied])

  return {
    voterUrl: guestUrl,
    adminUrl,
    copyAdminLink,
    copyVoterLink,
  }
}
