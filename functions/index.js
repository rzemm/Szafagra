import { onRequest } from 'firebase-functions/v2/https'
import { fetchSpotifyPlaylistTracks, isValidSpotifyPlaylistId, matchTracks } from './spotify.js'

const REGION = 'europe-west1'
const MAX_TRACKS_PER_MATCH_REQUEST = 10
const MAX_QUERY_LENGTH = 200

export const spotifyPlaylist = onRequest(
  { region: REGION, cors: true, maxInstances: 5 },
  async (req, res) => {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'method_not_allowed' })
      return
    }

    const playlistId = String(req.query.id ?? '')
    if (!isValidSpotifyPlaylistId(playlistId)) {
      res.status(400).json({ error: 'invalid_playlist_id' })
      return
    }

    try {
      const playlist = await fetchSpotifyPlaylistTracks(playlistId)
      res.set('Cache-Control', 'public, max-age=300')
      res.json(playlist)
    } catch (error) {
      const message = error?.message ?? 'unknown'
      const status = message === 'spotify_http_404' ? 404 : 502
      res.status(status).json({ error: message })
    }
  },
)

export const matchYtTracks = onRequest(
  { region: REGION, cors: true, maxInstances: 5 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' })
      return
    }

    const tracks = req.body?.tracks
    if (!Array.isArray(tracks) || tracks.length === 0 || tracks.length > MAX_TRACKS_PER_MATCH_REQUEST) {
      res.status(400).json({ error: 'invalid_tracks' })
      return
    }

    const sanitized = tracks.map((track) => ({
      query: String(track?.query ?? '').slice(0, MAX_QUERY_LENGTH).trim(),
    }))
    if (sanitized.some((track) => !track.query)) {
      res.status(400).json({ error: 'invalid_tracks' })
      return
    }

    try {
      const results = await matchTracks(sanitized)
      res.json({ results })
    } catch (error) {
      res.status(502).json({ error: error?.message ?? 'unknown' })
    }
  },
)
