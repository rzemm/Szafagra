import { createContext, useContext, useState } from 'react'
import { pl } from '../i18n/pl'
import { en } from '../i18n/en'

const translations = { pl, en }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'pl')

  const toggleLang = () => {
    const next = lang === 'pl' ? 'en' : 'pl'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  const t = (key, ...args) => {
    const dict = translations[lang]
    const val = dict[key]
    if (typeof val === 'function') return val(...args)
    return val ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
