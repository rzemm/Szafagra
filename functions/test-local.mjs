// Smoke test for the proxy core logic: node test-local.mjs
import { fetchSpotifyPlaylistTracks, matchTracks } from './spotify.js'

const playlist = await fetchSpotifyPlaylistTracks('37i9dQZF1DXcBWIGoYBM5M')
console.log(`playlist "${playlist.name}": ${playlist.tracks.length} tracks`)
console.log('first:', playlist.tracks[0])

const results = await matchTracks(playlist.tracks.slice(0, 3).map((track) => ({
  query: `${track.artists} ${track.title}`,
})))
for (let i = 0; i < results.length; i++) {
  const track = playlist.tracks[i]
  console.log(`match "${track.artists} - ${track.title}" (${Math.round(track.durationMs / 1000)}s):`)
  for (const candidate of results[i]) console.log('   ', candidate.seconds + 's', candidate.ytId, candidate.title)
}
