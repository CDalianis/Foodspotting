const AUTH_TOKEN_KEY = 'foodspots_access_token'
const AUTH_CHANGED_EVENT = 'auth-changed'

export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function subscribeAuthChanges(callback) {
  window.addEventListener(AUTH_CHANGED_EVENT, callback)
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, callback)
}

export function getUsernameFromToken(token = getAuthToken()) {
  if (!token) {
    return null
  }

  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded.sub || null
  } catch {
    return null
  }
}
