const JOIN_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const JOIN_CODE_LENGTH = 8

export function genId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

export function createJoinCode(length = JOIN_CODE_LENGTH) {
  const randomBytes = crypto.getRandomValues(new Uint8Array(length))

  return Array.from(randomBytes, (byte) => JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length]).join('')
}

export function formatTime(sec) {
  if (sec == null) return '--:--'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
