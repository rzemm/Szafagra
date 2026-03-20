const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/
const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY ?? null

export function extractYtId(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()

    let ytId = null

    if (host === 'youtu.be') {
      ytId = u.pathname.split('/').filter(Boolean)[0] ?? null
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      if (u.pathname === '/watch') ytId = u.searchParams.get('v')
      else if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) ytId = u.pathname.split('/')[2] ?? null
    }

    return ytId && YT_ID_RE.test(ytId) ? ytId : null
  } catch {
    return null
  }
}

export function extractYtPlaylistId(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      return u.searchParams.get('list') ?? null
    }
    return null
  } catch {
    return null
  }
}

export async function fetchYtPlaylistItems(playlistId) {
  if (!YT_API_KEY) throw new Error('Brak klucza YouTube API (VITE_YOUTUBE_API_KEY)')
  if (playlistId.startsWith('RD')) throw new Error('Listy "Mix" i "Polecane przez YouTube" nie są dostępne przez API. Dodaj utwory ręcznie lub użyj zwykłej playlisty YT.')
  const items = []
  let pageToken = ''
  do {
    const endpoint = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
    endpoint.searchParams.set('part', 'snippet')
    endpoint.searchParams.set('playlistId', playlistId)
    endpoint.searchParams.set('maxResults', '50')
    endpoint.searchParams.set('key', YT_API_KEY)
    if (pageToken) endpoint.searchParams.set('pageToken', pageToken)

    const res = await fetch(endpoint.toString())
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `YouTube API błąd ${res.status}`)
    }
    const data = await res.json()
    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId
      const title = item.snippet?.title
      if (videoId && title && title !== 'Deleted video' && title !== 'Private video') {
        items.push({ ytId: videoId, title, url: `https://youtu.be/${videoId}` })
      }
    }
    pageToken = data.nextPageToken ?? ''
  } while (pageToken)
  return items
}

export function cleanTitle(title) {
  if (typeof title !== 'string') return title
  return title
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim()
}

export async function searchYouTube(query, maxResults = 3) {
  if (!YT_API_KEY || !query.trim()) return []
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/search')
  endpoint.searchParams.set('part', 'snippet')
  endpoint.searchParams.set('type', 'video')
  endpoint.searchParams.set('maxResults', String(maxResults))
  endpoint.searchParams.set('q', query.trim())
  endpoint.searchParams.set('key', YT_API_KEY)
  const res = await fetch(endpoint.toString())
  if (!res.ok) return []
  const data = await res.json()
  return (data.items ?? []).map((item) => ({
    ytId: item.id.videoId,
    title: cleanTitle(item.snippet.title),
    thumbnail: item.snippet.thumbnails?.default?.url ?? null,
  }))
}

export async function fetchYtTitle(url) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    if (!res.ok) return null
    return (await res.json()).title ?? null
  } catch {
    return null
  }
}
