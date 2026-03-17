const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/

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

export async function fetchYtTitle(url) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
    if (!res.ok) return null
    return (await res.json()).title ?? null
  } catch {
    return null
  }
}
