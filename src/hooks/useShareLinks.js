import { useCallback, useMemo } from 'react'

export function useShareLinks({ roomId, roomType, guestToken, buildRoomUrl, fallbackGuestUrl, onCopied }) {
  const guestUrl = useMemo(() => {
    if (guestToken) return buildRoomUrl(guestToken)
    return fallbackGuestUrl ?? null
  }, [buildRoomUrl, fallbackGuestUrl, guestToken])

  const adminUrl = useMemo(() => {
    if (!roomId) return null
    return buildRoomUrl(roomId)
  }, [buildRoomUrl, roomId])

  const copyAdminLink = useCallback(() => {
    const link = roomType === 'public' ? guestUrl : adminUrl
    if (!link) return
    navigator.clipboard.writeText(link).then(() => onCopied('admin'))
  }, [adminUrl, guestUrl, onCopied, roomType])

  const copyVoterLink = useCallback(async () => {
    if (!guestUrl) return
    if (navigator.share) {
      try {
        await navigator.share({ url: guestUrl })
        return
      } catch {
        // user cancelled or share failed – fall through to clipboard
      }
    }
    navigator.clipboard.writeText(guestUrl).then(() => onCopied('voter'))
  }, [guestUrl, onCopied])

  return {
    voterUrl: guestUrl,
    adminUrl,
    guestUrl,
    copyAdminLink,
    copyVoterLink,
  }
}
