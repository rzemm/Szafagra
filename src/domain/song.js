function normalizeId(id, genId) {
  if (typeof id === 'string' && id.trim()) return id.trim()
  return genId()
}

export function createAddedByUser(user) {
  if (!user || user.isAnonymous) return null

  return {
    uid: user.uid,
    name: user.displayName || user.email || null,
  }
}

export function createAddedBySuggestion(suggestion) {
  if (!suggestion?.userId) return null

  return { uid: suggestion.userId }
}

export function createSong({
  genId,
  id,
  title,
  ytId,
  url,
  addedBy = null,
}) {
  const normalizedYtId = typeof ytId === 'string' ? ytId.trim() : ''
  const normalizedUrl = typeof url === 'string' && url.trim()
    ? url.trim()
    : (normalizedYtId ? `https://youtu.be/${normalizedYtId}` : '')

  return {
    id: normalizeId(id, genId),
    title,
    ytId: normalizedYtId,
    url: normalizedUrl,
    ...(addedBy ? { addedBy } : {}),
  }
}

export function attachSongIds(songs, genId) {
  if (!Array.isArray(songs)) return []
  return songs.map((song) => createSong({ genId, ...song }))
}
