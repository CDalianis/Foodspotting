import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getLanguage,
  initLanguage,
  setLanguage as persistLanguage,
  subscribeLanguageChanges,
  translate,
} from './language'
import { el } from './locales/el'
import { en } from './locales/en'

const dictionaries = { en, el }

const I18nContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => initLanguage())

  useEffect(() => {
    return subscribeLanguageChanges(() => {
      setLanguageState(getLanguage())
    })
  }, [])

  const setLanguage = useCallback((next) => {
    setLanguageState(persistLanguage(next))
  }, [])

  const t = useCallback(
    (key, params) => translate(dictionaries[language] || en, key, params),
    [language],
  )

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
