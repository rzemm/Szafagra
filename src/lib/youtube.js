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

export async function fetchLikedVideosPage(accessToken, pageToken = null) {
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos')
  endpoint.searchParams.set('part', 'snippet')
  endpoint.searchParams.set('myRating', 'like')
  endpoint.searchParams.set('maxResults', '20')
  if (pageToken) endpoint.searchParams.set('pageToken', pageToken)
  const res = await fetch(endpoint.toString(), { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `YouTube API błąd ${res.status}`)
  }
  const data = await res.json()
  const items = (data.items ?? [])
    .filter((item) => item.id && item.snippet?.title)
    .map((item) => ({ ytId: item.id, title: item.snippet.title, url: `https://youtu.be/${item.id}` }))
  return { items, nextPageToken: data.nextPageToken ?? null }
}

export async function fetchYtPlaylistPage(playlistId, accessToken = null, pageToken = null) {
  if (!accessToken && !YT_API_KEY) throw new Error('Brak klucza YouTube API (VITE_YOUTUBE_API_KEY)')
  if (playlistId.startsWith('RD')) throw new Error('Listy "Mix" i "Polecane przez YouTube" nie są dostępne przez API. Dodaj utwory ręcznie lub użyj zwykłej playlisty YT.')
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
  endpoint.searchParams.set('part', 'snippet')
  endpoint.searchParams.set('playlistId', playlistId)
  endpoint.searchParams.set('maxResults', '20')
  if (!accessToken) endpoint.searchParams.set('key', YT_API_KEY)
  if (pageToken) endpoint.searchParams.set('pageToken', pageToken)
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  const res = await fetch(endpoint.toString(), { headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `YouTube API błąd ${res.status}`)
  }
  const data = await res.json()
  const items = []
  for (const item of data.items ?? []) {
    const videoId = item.snippet?.resourceId?.videoId
    const title = item.snippet?.title
    if (videoId && title && title !== 'Deleted video' && title !== 'Private video') {
      items.push({ ytId: videoId, title, url: `https://youtu.be/${videoId}` })
    }
  }
  return { items, nextPageToken: data.nextPageToken ?? null }
}

export async function fetchYtPlaylistItems(playlistId, accessToken = null) {
  if (!accessToken && !YT_API_KEY) throw new Error('Brak klucza YouTube API (VITE_YOUTUBE_API_KEY)')
  if (playlistId.startsWith('RD')) throw new Error('Listy "Mix" i "Polecane przez YouTube" nie są dostępne przez API. Dodaj utwory ręcznie lub użyj zwykłej playlisty YT.')
  const items = []
  let pageToken = ''
  do {
    const endpoint = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
    endpoint.searchParams.set('part', 'snippet')
    endpoint.searchParams.set('playlistId', playlistId)
    endpoint.searchParams.set('maxResults', '50')
    if (!accessToken) endpoint.searchParams.set('key', YT_API_KEY)
    if (pageToken) endpoint.searchParams.set('pageToken', pageToken)

    const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    const res = await fetch(endpoint.toString(), { headers })
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

export const YT_LIKED_PLAYLIST_ID = 'LL'

export async function fetchUserYtPlaylists(accessToken) {
  const playlists = []
  let pageToken = ''
  do {
    const endpoint = new URL('https://www.googleapis.com/youtube/v3/playlists')
    endpoint.searchParams.set('part', 'snippet,contentDetails')
    endpoint.searchParams.set('mine', 'true')
    endpoint.searchParams.set('maxResults', '50')
    if (pageToken) endpoint.searchParams.set('pageToken', pageToken)

    const res = await fetch(endpoint.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `YouTube API błąd ${res.status}`)
    }
    const data = await res.json()
    for (const item of data.items ?? []) {
      playlists.push({
        id: item.id,
        title: item.snippet?.title ?? 'Bez tytułu',
        thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
        itemCount: item.contentDetails?.itemCount ?? 0,
      })
    }
    pageToken = data.nextPageToken ?? ''
  } while (pageToken)

  playlists.unshift({ id: YT_LIKED_PLAYLIST_ID, thumbnail: null, itemCount: null })

  return playlists
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
  return (data.items ?? [])
    .filter((item) => item.id?.videoId)
    .map((item) => ({
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
