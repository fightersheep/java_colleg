export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

export async function request(path, { method = 'GET', body, token, signal } = {}) {
  let response
  try {
    response = await fetch(path, {
      method, signal, credentials: 'omit',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Cannot reach the backend. Make sure the server is running and try again.', 0)
  }
  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    throw new ApiError('The server returned an unexpected response. Check the backend connection.', response.status)
  }
  if (!response.ok) {
    const fallback = response.status === 403 ? 'Your account does not have permission to access this resource.'
      : response.status === 401 ? 'Please sign in again to continue.'
        : response.status >= 500 ? 'The backend is unavailable. Please try again in a moment.'
          : `Request failed (${response.status}). Please try again.`
    throw new ApiError(data?.error || data?.message || fallback, response.status, data?.fields)
  }
  return data
}
