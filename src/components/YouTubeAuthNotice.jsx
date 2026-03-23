export function YouTubeAuthNotice({ helpText, className = 'yt-auth-notice' }) {
  if (!helpText?.title && !helpText?.body) return null

  return (
    <div className={className}>
      {helpText.title && <strong>{helpText.title}</strong>}
      {helpText.body && <span>{helpText.body}</span>}
    </div>
  )
}
