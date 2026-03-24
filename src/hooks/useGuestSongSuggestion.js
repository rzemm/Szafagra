import { useEffect, useState } from 'react'
import { extractYtId, fetchYtTitle, searchYouTube } from '../lib/youtube'

export function useGuestSongSuggestion({ submitSuggestion, t }) {
  const [suggestUrl, setSuggestUrl] = useState('')
  const [suggestTitle, setSuggestTitle] = useState('')
  const [suggestErr, setSuggestErr] = useState('')
  const [fetchingTitle, setFetchingTitle] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [suggestSearchResults, setSuggestSearchResults] = useState([])

  useEffect(() => {
    const isUrl = suggestUrl.includes('youtube.com') || suggestUrl.includes('youtu.be')
    if (isUrl || suggestUrl.trim().length < 3) {
      return
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchYouTube(suggestUrl.trim(), 5)
        setSuggestSearchResults(results)
      } catch {
        setSuggestSearchResults([])
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [suggestUrl])

  const resetSuggestionState = () => {
    setSuggestUrl('')
    setSuggestTitle('')
    setSuggestErr('')
  }

  const markSubmitted = () => {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  const handleSuggestBlur = async () => {
    const url = suggestUrl.trim()
    if (!url) return

    const ytId = extractYtId(url)
    if (!ytId) {
      setSuggestErr(t('invalidYouTubeLink'))
      return
    }

    setSuggestErr('')
    setFetchingTitle(true)
    const title = await fetchYtTitle(url)
    setFetchingTitle(false)

    if (title) setSuggestTitle(title)
    else setSuggestErr(t('couldNotFetchTitle'))
  }

  const handleSubmitSuggestion = async () => {
    const url = suggestUrl.trim()
    const ytId = extractYtId(url)
    if (!ytId || !suggestTitle) return

    setSubmitting(true)
    const ok = await submitSuggestion({ title: suggestTitle, ytId, url: `https://youtu.be/${ytId}` })
    setSubmitting(false)

    if (ok) {
      resetSuggestionState()
      markSubmitted()
    }
  }

  const handleSelectSuggestion = async (suggestion) => {
    setSuggestSearchResults([])
    setSubmitting(true)
    const ok = await submitSuggestion({ title: suggestion.title, ytId: suggestion.ytId, url: `https://youtu.be/${suggestion.ytId}` })
    setSubmitting(false)

    if (ok) {
      resetSuggestionState()
      markSubmitted()
    }
  }

  return {
    suggestUrl,
    suggestTitle,
    suggestErr,
    fetchingTitle,
    submitting,
    submitted,
    suggestSearchResults,
    setSuggestUrl,
    setSuggestTitle,
    setSuggestErr,
    setSuggestSearchResults,
    handleSuggestBlur,
    handleSubmitSuggestion,
    handleSelectSuggestion,
  }
}
