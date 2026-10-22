const SESSION_KEY = 'jwt-workspace.session'

export function createSession(data, now = Date.now()) {
  if (!data || typeof data.token !== 'string' || !data.token || typeof data.username !== 'string' || !Array.isArray(data.roles) || !data.roles.every(role => typeof role === 'string') || !Number.isFinite(data.expiresInMs) || data.expiresInMs <= 0) {
    throw new Error('The server returned an invalid sign-in response. Please try again.')
  }
  return { token: data.token, username: data.username, roles: data.roles, expiresAt: now + data.expiresInMs }
}

export function readSession() {
  try {
    const data = JSON.parse(sessionStorage.getItem(SESSION_KEY))
    if (data && typeof data.token === 'string' && data.token && typeof data.username === 'string' && Array.isArray(data.roles) && data.roles.every(role => typeof role === 'string') && Number.isFinite(data.expiresAt) && data.expiresAt > Date.now()) return data
    sessionStorage.removeItem(SESSION_KEY)
  } catch { /* A blocked or corrupted storage entry should not prevent sign-in. */ }
  return null
}

export function storeSession(session) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch { /* Keep an in-memory session when browser storage is unavailable. */ }
}
