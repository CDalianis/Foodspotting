const LANGUAGE_KEY = 'foodspots_language'
const LANGUAGE_CHANGED_EVENT = 'language-changed'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', nativeLabel: 'English' },
  { code: 'el', label: 'EL', nativeLabel: 'Ελληνικά' },
]

export function getLanguage() {
  const stored = localStorage.getItem(LANGUAGE_KEY)
  if (stored === 'el' || stored === 'en') return stored

  const browser = (navigator.language || 'en').toLowerCase()
  return browser.startsWith('el') ? 'el' : 'en'
}

export function applyLanguage(language) {
  const normalized = language === 'el' ? 'el' : 'en'
  document.documentElement.setAttribute('lang', normalized)
  localStorage.setItem(LANGUAGE_KEY, normalized)
  window.dispatchEvent(new Event(LANGUAGE_CHANGED_EVENT))
  return normalized
}

export function initLanguage() {
  return applyLanguage(getLanguage())
}

export function setLanguage(language) {
  return applyLanguage(language)
}

export function subscribeLanguageChanges(callback) {
  window.addEventListener(LANGUAGE_CHANGED_EVENT, callback)
  return () => window.removeEventListener(LANGUAGE_CHANGED_EVENT, callback)
}

export function translate(messages, key, params = {}) {
  const template = messages[key] ?? key
  return template.replace(/\{(\w+)\}/g, (_, name) => {
    const value = params[name]
    return value == null ? `{${name}}` : String(value)
  })
}
