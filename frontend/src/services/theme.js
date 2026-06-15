const THEME_KEY = 'foodspots_theme'
const THEME_CHANGED_EVENT = 'theme-changed'

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark'
}

export function applyTheme(theme) {
  const normalized = theme === 'light' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', normalized)
  localStorage.setItem(THEME_KEY, normalized)
  window.dispatchEvent(new Event(THEME_CHANGED_EVENT))
  return normalized
}

export function initTheme() {
  return applyTheme(getTheme())
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  return applyTheme(next)
}

export function subscribeThemeChanges(callback) {
  window.addEventListener(THEME_CHANGED_EVENT, callback)
  return () => window.removeEventListener(THEME_CHANGED_EVENT, callback)
}
