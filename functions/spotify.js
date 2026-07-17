// Core logic for the Spotify playlist import proxy. Kept separate from
// index.js so it can be smoke-tested with plain Node (node test-local.mjs).

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const SPOTIFY_ID_RE = /^[a-zA-Z0-9]{22}$/

export function isValidSpotifyPlaylistId(id) {
  return typeof id === 'string' && SPOTIFY_ID_RE.test(id)
}

// Reads the public embed page of a playlist. Unofficial: Spotify can change
// this markup at any time, so parse defensively and fail loudly.
export async function fetchSpotifyPlaylistTracks(playlistId) {
  const res = await fetch(`https://open.spotify.com/embed/playlist/${playlistId}`, {
    headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en' },
  })
  if (!res.ok) {
    throw new Error(`spotify_http_${res.status}`)
  }

  const html = await res.text()
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) throw new Error('spotify_markup_changed')

  let entity
  try {
    entity = JSON.parse(match[1])?.props?.pageProps?.state?.data?.entity
  } catch {
    throw new Error('spotify_markup_changed')
  }

  const trackList = Array.isArray(entity?.trackList) ? entity.trackList : null
  if (!trackList) throw new Error('spotify_no_tracks')

  const tracks = trackList
    .filter((item) => typeof item?.uri === 'string' && item.uri.startsWith('spotify:track:') && item.title)
    .map((item) => ({
      title: item.title,
      artists: typeof item.subtitle === 'string' ? item.subtitle : '',
      durationMs: typeof item.duration === 'number' ? item.duration : null,
    }))

  return {
    name: entity?.title ?? entity?.name ?? '',
    tracks,
  }
}

function parseLengthToSeconds(text) {
  if (typeof text !== 'string') return null
  const parts = text.split(':').map((part) => Number.parseInt(part, 10))
  if (parts.some((n) => Number.isNaN(n))) return null
  return parts.reduce((acc, n) => acc * 60 + n, 0)
}

function collectVideoResults(node, out, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 30 || out.length >= 4) return
  if (node.videoRenderer?.videoId) {
    const vr = node.videoRenderer
    out.push({
      ytId: vr.videoId,
      title: vr.title?.runs?.map((run) => run.text).join('') ?? '',
      seconds: parseLengthToSeconds(vr.lengthText?.simpleText),
    })
    return
  }
  if (Array.isArray(node)) {
    for (const item of node) collectVideoResults(item, out, depth + 1)
    return
  }
  for (const value of Object.values(node)) collectVideoResults(value, out, depth + 1)
}

// YouTube's internal search endpoint (Innertube). Free of Data API quota,
// but unofficial - same caveat as the Spotify embed above.
export async function searchYouTubeCandidates(query) {
  const res = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': BROWSER_UA },
    body: JSON.stringify({
      context: { client: { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'en', gl: 'US' } },
      query,
    }),
  })
  if (!res.ok) throw new Error(`youtube_http_${res.status}`)

  const data = await res.json()
  const results = []
  collectVideoResults(data, results)
  return results
}

export async function matchTracks(tracks) {
  return Promise.all(tracks.map(async ({ query }) => {
    try {
      return await searchYouTubeCandidates(query)
    } catch {
      return []
    }
  }))
}
