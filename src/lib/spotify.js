import { firebaseConfig } from '../firebase'

const SPOTIFY_ID_RE = /^[a-zA-Z0-9]{22}$/
const MATCH_BATCH_SIZE = 10

const FUNCTIONS_BASE_URL = import.meta.env.VITE_FUNCTIONS_BASE_URL
  || `https://europe-west1-${firebaseConfig.projectId}.cloudfunctions.net`

export function extractSpotifyPlaylistId(input) {
  const raw = (input ?? '').trim()
  if (!raw) return null
  if (SPOTIFY_ID_RE.test(raw)) return raw

  const uriMatch = raw.match(/^spotify:playlist:([a-zA-Z0-9]{22})$/)
  if (uriMatch) return uriMatch[1]

  try {
    const url = new URL(raw)
    if (!url.hostname.toLowerCase().endsWith('spotify.com')) return null
    const pathMatch = url.pathname.match(/\/playlist\/([a-zA-Z0-9]{22})(?:$|\/)/)
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}

export async function fetchSpotifyPlaylist(playlistId) {
  const res = await fetch(`${FUNCTIONS_BASE_URL}/spotifyPlaylist?id=${encodeURIComponent(playlistId)}`)
  if (!res.ok) throw new Error(`proxy_${res.status}`)
  return res.json()
}

// Matches tracks in batches; calls onBatch(startIndex, candidatesPerTrack)
// as results arrive so the UI can update progressively.
export async function matchTracksToYouTube(tracks, { onBatch, isCancelled } = {}) {
  for (let start = 0; start < tracks.length; start += MATCH_BATCH_SIZE) {
    if (isCancelled?.()) return
    const batch = tracks.slice(start, start + MATCH_BATCH_SIZE)
    let results
    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/matchYtTracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracks: batch.map((track) => ({ query: `${track.artists} ${track.title}`.trim() })),
        }),
      })
      results = res.ok ? (await res.json()).results : batch.map(() => [])
    } catch {
      results = batch.map(() => [])
    }
    if (isCancelled?.()) return
    onBatch?.(start, results)
  }
}

const UNDESIRED_RE = /\b(live|cover|remix|reaction|sped.?up|slowed|8d|karaoke|instrumental|nightcore)\b/i
const PREFERRED_RE = /\b(official (audio|video|music video)|lyric(s| video)?|audio)\b/i

// Picks the candidate whose duration is closest to the Spotify track,
// avoiding covers/live versions unless the original title asks for them.
export function pickBestCandidateIndex(track, candidates) {
  if (!candidates?.length) return -1
  const sourceText = `${track.artists} ${track.title}`
  const wantedSeconds = track.durationMs ? track.durationMs / 1000 : null

  let bestIdx = 0
  let bestScore = -Infinity
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    let score = -i // preserve search ranking as tiebreak

    if (wantedSeconds && candidate.seconds) {
      score -= Math.min(Math.abs(candidate.seconds - wantedSeconds), 60)
    }
    if (UNDESIRED_RE.test(candidate.title) && !UNDESIRED_RE.test(sourceText)) {
      score -= 25
    }
    if (PREFERRED_RE.test(candidate.title)) {
      score += 5
    }

    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  return bestIdx
}
